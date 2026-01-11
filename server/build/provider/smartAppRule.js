"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const smartapp_1 = require("@smartthings/smartapp");
const core_sdk_1 = require("@smartthings/core-sdk");
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const global_1 = __importDefault(require("../constants/global"));
const ruleStore_1 = __importDefault(require("./ruleStore"));
const smartAppContextStore_1 = __importDefault(require("./smartAppContextStore"));
const createTriggerRuleFromConfigOperation_1 = __importDefault(require("../operations/createTriggerRuleFromConfigOperation"));
const createIdleRuleFromConfigOperation_1 = __importDefault(require("../operations/createIdleRuleFromConfigOperation"));
const submitRulesForSmartAppOperation_1 = __importDefault(require("../operations/submitRulesForSmartAppOperation"));
const createTransitionRuleFromConfigOperation_1 = __importDefault(require("../operations/createTransitionRuleFromConfigOperation"));
const readConfigFromContext_1 = __importStar(require("../operations/readConfigFromContext"));
const uniqueDeviceFactory_1 = __importDefault(require("../factories/uniqueDeviceFactory"));
const createCombinedRuleFromConfigOperation_1 = __importDefault(require("../operations/createCombinedRuleFromConfigOperation"));
const createRuleSummaryFromConfigOperation_1 = __importDefault(require("../operations/createRuleSummaryFromConfigOperation"));
const storeRulesAndNotifyOperation_1 = __importDefault(require("../operations/storeRulesAndNotifyOperation"));
dayjs_1.default.extend(customParseFormat_1.default);
dayjs_1.default.extend(utc_1.default);
const noonHour = 12;
const offset6Hours = 360;
const increment5 = 5;
const hourOffset8 = 8;
const hourOffset20 = 20;
if (!process.env.RULE_APP_ID || !process.env.RULE_CLIENT_ID || !process.env.RULE_CLIENT_SECRET || !process.env.CONTROL_API_TOKEN) {
    throw new Error('Missing required environment variables for SmartApp configuration (RULE_APP_ID, RULE_CLIENT_ID, RULE_CLIENT_SECRET, CONTROL_API_TOKEN)');
}
// const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const contextStore = (0, smartAppContextStore_1.default)(process.env.RULE_APP_ID);
const rulesAreModified = (ruleStoreKey, newRule) => __awaiter(void 0, void 0, void 0, function* () {
    const existingRules = yield ruleStore_1.default.get(ruleStoreKey);
    return (!existingRules || JSON.stringify(newRule) !== JSON.stringify(existingRules.combinedRule));
});
/* Define the SmartApp */
exports.default = new smartapp_1.SmartApp()
    .enableEventLogging()
    .configureI18n()
    .permissions(['r:devices:*', 'x:devices:*', 'r:rules:*', 'w:rules:*'])
    .appId(process.env.RULE_APP_ID)
    .clientId(process.env.RULE_CLIENT_ID)
    .clientSecret(process.env.RULE_CLIENT_SECRET)
    .contextStore(contextStore)
    // Configuration page definition
    .page('rulesMainPage', (context, page /* , configData */) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    yield page.section('description', (section) => __awaiter(void 0, void 0, void 0, function* () {
        const config = yield (0, readConfigFromContext_1.default)(context);
        if (!config.dayControlSwitch || !config.nightControlSwitch) {
            // eslint-disable-next-line no-console
            console.warn('Day or Night control switch not configured in main page, cannot create rules');
            return;
        }
        const uniqueDaySwitches = (0, uniqueDeviceFactory_1.default)([config.dayControlSwitch].concat(config.dayActiveSwitches));
        const uniqueNightSwitches = (0, uniqueDeviceFactory_1.default)([config.nightControlSwitch].concat(config.nightActiveSwitches));
        const uniqueSwitches = (0, uniqueDeviceFactory_1.default)(uniqueDaySwitches.concat(uniqueNightSwitches));
        const motionSensorNames = config.motionSensors.map(s => s.label).join(config.motionMultipleAll ? ' AND ' : ' OR ');
        const idleMotionSensorNames = config.motionSensors.map(s => s.label).join(!config.motionMultipleAll ? ' AND ' : ' OR ');
        const dayStartTime = (0, dayjs_1.default)().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayStartOffset, 'minutes').format('hh:mm A');
        const dayNightTime = (0, dayjs_1.default)().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayNightOffset, 'minutes').format('hh:mm A');
        const nightEndTime = (0, dayjs_1.default)().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.nightEndOffset, 'minutes').format('hh:mm A');
        // these strings are not localized because i'm unsure how to use the built-in I18n mechanics with dynamic config-driven values interpolated
        const daylightRuleDescription = `DAYLIGHT RULE: Between [${dayStartTime}] and [${dayNightTime}] `
            + `When [${motionSensorNames}] are ACTIVE for [${config.motionDurationDelay} second(s)] `
            + `these devices [${uniqueDaySwitches.map(s => s.label).join(', ')}] `
            + 'will turn ON.';
        const daylightRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableDaylightRule ? 'ENABLED' : 'DISABLED'}`;
        const nightlightRuleDescription = `NIGHTLIGHT RULE: Between [${dayNightTime}] and [${nightEndTime}] `
            + `When [${motionSensorNames}] are ACTIVE for [${config.motionDurationDelay} second(s)] `
            + `these devices [${uniqueNightSwitches.map(s => s.label).join(', ')}] `
            + 'will turn ON.';
        const nightlightRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableNightlightRule ? 'ENABLED' : 'DISABLED'}`;
        const idleRuleDescription = `IDLE RULE: When [${idleMotionSensorNames}] are INACTIVE for [${config.motionIdleTimeout} ${config.motionIdleTimeoutUnit}(s)] `
            + `these devices [${uniqueSwitches.map(s => s.label).join(', ')}] `
            + 'will turn OFF.';
        const idleRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableIdleRule ? 'ENABLED' : 'DISABLED'}`;
        const transitionRuleDescription = `TRANSITION RULE: At [${dayNightTime}] `
            + `these devices [${uniqueDaySwitches.map(s => s.label).join(', ')}] will turn OFF (or be modified to their Night levels) `
            + `and [${uniqueNightSwitches.map(s => s.label).join(', ')}] will turn ON (or be modified to their Night levels).`;
        const transitionRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableDaylightRule && config.enableNightlightRule ? 'ENABLED' : 'DISABLED'}`;
        section
            .paragraphSetting('daylightRuleSummary')
            .name(daylightRuleDescription)
            .description(daylightRuleEnabledDesc);
        section
            .paragraphSetting('nightlightRuleSummary')
            .name(nightlightRuleDescription)
            .description(nightlightRuleEnabledDesc);
        section
            .paragraphSetting('idleRuleSummary')
            .name(idleRuleDescription)
            .description(idleRuleEnabledDesc);
        section
            .paragraphSetting('transitionRuleSummary')
            .name(transitionRuleDescription)
            .description(transitionRuleEnabledDesc);
    }));
    page.section('types', section => {
        section.hideable(true);
        section.booleanSetting('enableAllRules').defaultValue('true');
        section.booleanSetting('enableDaylightRule').defaultValue('true');
        section.booleanSetting('enableNightlightRule').defaultValue('true');
        section.booleanSetting('enableIdleRule').defaultValue('true');
    });
    page.section('sensors', section => {
        section.hideable(true);
        section
            .deviceSetting('motionSensor')
            .capabilities(['motionSensor'])
            .multiple(true)
            .required(true);
        section.numberSetting('motionDurationDelay')
            .min(0)
            .max(60)
            .step(increment5)
            .defaultValue(0);
        section.numberSetting('motionIdleTimeout')
            .min(0)
            .max(offset6Hours)
            .step(increment5)
            .defaultValue(0);
        section.booleanSetting('motionIdleTimeoutUnit');
        section.booleanSetting('motionMultipleAll');
    });
    page.section('switches', section => {
        section.hideable(true);
        section
            .deviceSetting('dayControlSwitch')
            .capabilities(['switch'])
            .required(true)
            .permissions('rx')
            .submitOnChange(true);
        section
            .deviceSetting('dayActiveSwitches')
            .capabilities(['switch'])
            .multiple(true)
            .permissions('rx')
            .submitOnChange(true);
        section
            .deviceSetting('nightControlSwitch')
            .capabilities(['switch'])
            .required(true)
            .permissions('rx')
            .submitOnChange(true);
        section
            .deviceSetting('nightActiveSwitches')
            .capabilities(['switch'])
            .multiple(true)
            .permissions('rx')
            .submitOnChange(true);
    });
    page.section('timings', section => {
        section.hideable(true);
        // from 8AM
        section.timeSetting('dayStartOffsetTime')
            .defaultValue((0, dayjs_1.default)().hour(hourOffset8).minute(0).second(0).millisecond(0).toISOString());
        // from 8PM
        section.timeSetting('dayNightOffsetTime')
            .defaultValue((0, dayjs_1.default)().hour(hourOffset20).minute(0).second(0).millisecond(0).toISOString());
        // from 8AM
        section.timeSetting('nightEndOffsetTime')
            .defaultValue((0, dayjs_1.default)().hour(hourOffset8).minute(0).second(0).millisecond(0).toISOString());
    });
    // i know this does something, even though apparently the typedefs say otherwise
    // eslint-disable-next-line @typescript-eslint/await-thenable
    yield page.section('levels', (section) => __awaiter(void 0, void 0, void 0, function* () {
        section.hideable(true);
        if (!context.isAuthenticated()) {
            section
                .paragraphSetting('levelNotAuthorized');
            // if you havent ever accepted scopes (new install, etc) we cannot do device lookups below successfully, bail now
            return;
        }
        let allDimmableSwitches;
        try {
            allDimmableSwitches = yield context.api.devices.list({ capability: 'switchLevel' });
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log('api lookup failed even though isAuthenticated', e);
            return;
        }
        const daySwitches = ((yield context.configDevices('dayControlSwitch'))).concat((yield context.configDevices('dayActiveSwitches')))
            .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
        const nightSwitches = ((yield context.configDevices('nightControlSwitch'))).concat((yield context.configDevices('nightActiveSwitches')))
            .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
        const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
        const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
        dayDimmableSwitches.forEach(s => {
            section.numberSetting(`dayLevel${s.deviceId}`)
                .name(`${s.label} Day Dimming Level`)
                .min(10)
                .max(100)
                .step(increment5)
                .defaultValue(global_1.default.rule.default.switchDayLevel);
            // slider would be nice, but UI provides no numerical feedback, so worthless =\
            // @disabled-ts-expect-error
            // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
        });
        nightDimmableSwitches.forEach(s => {
            section.numberSetting(`nightLevel${s.deviceId}`)
                .name(`${s.label} Night Dimming Level`)
                .min(10)
                .max(100)
                .step(increment5)
                .defaultValue(global_1.default.rule.default.switchNightLevel);
            // slider would be nice, but UI provides no numerical feedback, so worthless =\
            // @disabled-ts-expect-error
            // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
        });
    }));
}))
    .updated((context, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!context.isAuthenticated()) {
        // if you havent ever accepted scopes (new install, etc) we cannot do device lookups below successfully, bail now
        return;
    }
    const appKey = `app-${updateData.installedApp.installedAppId}`;
    const newConfig = yield (0, readConfigFromContext_1.default)(context);
    if (!newConfig.dayControlSwitch || !newConfig.nightControlSwitch) {
        // eslint-disable-next-line no-console
        console.warn('Day or Night control switch not configured in updated, cannot create rules');
        return;
    }
    const allDimmableSwitches = yield context.api.devices.list({ capability: 'switchLevel' });
    const uniqueDaySwitches = (0, uniqueDeviceFactory_1.default)([newConfig.dayControlSwitch].concat(newConfig.dayActiveSwitches));
    const uniqueNightSwitches = (0, uniqueDeviceFactory_1.default)([newConfig.nightControlSwitch].concat(newConfig.nightActiveSwitches));
    const uniqueSwitches = (0, uniqueDeviceFactory_1.default)(uniqueDaySwitches.concat(uniqueNightSwitches));
    const allConfigSwitchLevels = (0, readConfigFromContext_1.readDeviceLevelConfigFromContext)(context, uniqueSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId)));
    const dayDimmableSwitches = uniqueDaySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const nightDimmableSwitches = uniqueNightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const dayNonDimmableSwitches = uniqueDaySwitches.filter(s => !allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const nightNonDimmableSwitches = uniqueNightSwitches.filter(s => !allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    // the find here better work because all switches needs to map to the valid dimmable switch the user configured
    const dayDimmableSwitchLevels = dayDimmableSwitches.map(s => ({ deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId).switchDayLevel }));
    const nightDimmableSwitchLevels = nightDimmableSwitches.map(s => ({ deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId).switchNightLevel }));
    const dayRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule');
    const nightRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableNightlightRule');
    const idleRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableIdleRule');
    const transitionRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule') && context.configBooleanValue('enableNightlightRule');
    // console.log('e1', dayRuleEnabled, 'e2', nightRuleEnabled, 'e3', idleRuleEnabled, 'e4', transitionRuleEnabled, 'e0', context.configBooleanValue('enableAllRules'));
    // console.log('newConfig', newConfig);
    const newDayRule = dayRuleEnabled ? (0, createTriggerRuleFromConfigOperation_1.default)(newConfig.dayStartOffset, newConfig.dayNightOffset, newConfig.motionSensors.map(d => d.deviceId), newConfig.dayControlSwitch.deviceId, dayDimmableSwitchLevels, dayNonDimmableSwitches.map(s => s.deviceId), newConfig.motionMultipleAll, newConfig.motionDurationDelay) : null;
    const newNightRule = nightRuleEnabled ? (0, createTriggerRuleFromConfigOperation_1.default)(newConfig.dayNightOffset, newConfig.nightEndOffset, newConfig.motionSensors.map(d => d.deviceId), newConfig.nightControlSwitch.deviceId, nightDimmableSwitchLevels, nightNonDimmableSwitches.map(s => s.deviceId), newConfig.motionMultipleAll, newConfig.motionDurationDelay) : null;
    const newIdleRule = idleRuleEnabled ? (0, createIdleRuleFromConfigOperation_1.default)(newConfig.motionSensors.map(d => d.deviceId), uniqueSwitches.map(d => d.deviceId), newConfig.motionIdleTimeout, newConfig.motionIdleTimeoutUnit, !newConfig.motionMultipleAll // you invert this setting for the idle case
    ) : null;
    const newTransitionRule = transitionRuleEnabled ? (0, createTransitionRuleFromConfigOperation_1.default)(appKey, newConfig.dayNightOffset, uniqueDaySwitches.map(s => s.deviceId), nightDimmableSwitchLevels, nightNonDimmableSwitches.map(s => s.deviceId)) : null;
    const newCombinedRule = (0, createCombinedRuleFromConfigOperation_1.default)(appKey, newDayRule, newNightRule, newIdleRule);
    const newRuleSummary = (0, createRuleSummaryFromConfigOperation_1.default)(newConfig, // above we ensured the conflicting nullable values are not null, so it is this type
    uniqueDaySwitches, dayDimmableSwitches, dayNonDimmableSwitches, dayDimmableSwitchLevels, uniqueNightSwitches, nightDimmableSwitches, nightNonDimmableSwitches, nightDimmableSwitchLevels, updateData.installedApp.installedAppId, [] // will be filled in
    );
    // TODO: somewhere around here we could sync this against the exiting rulestore, to sync webapp side with the smartapp side
    //       the way things are now, changes to an app just steamroll the webapp side with a new config created from scratch
    // TODO: think rulesAreModified should really check both combined rule and transition rule
    if (yield rulesAreModified(updateData.installedApp.installedAppId, newCombinedRule)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_unused, newCombinedRuleId, newTransitionRuleId] = yield (0, submitRulesForSmartAppOperation_1.default)(new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN)), context.api.locations.locationId(), appKey, newCombinedRule, newTransitionRule, newRuleSummary);
        yield (0, storeRulesAndNotifyOperation_1.default)(updateData.installedApp.installedAppId, newCombinedRule, newCombinedRuleId, newTransitionRule, newTransitionRuleId, newRuleSummary);
    }
    else {
        // eslint-disable-next-line no-console
        console.log('Rules not modified, nothing to update');
    }
}));
//# sourceMappingURL=smartAppRule.js.map