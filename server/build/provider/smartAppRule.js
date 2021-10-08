"use strict";
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
const file_context_store_1 = __importDefault(require("@smartthings/file-context-store"));
const smartapp_1 = require("@smartthings/smartapp");
const core_sdk_1 = require("@smartthings/core-sdk");
const simple_json_db_1 = __importDefault(require("simple-json-db"));
const db_1 = __importDefault(require("./db"));
const createTriggerRuleFromConfigOperation_1 = __importDefault(require("../operations/createTriggerRuleFromConfigOperation"));
const createIdleRuleFromConfigOperation_1 = __importDefault(require("../operations/createIdleRuleFromConfigOperation"));
const submitRulesForSmartAppOperation_1 = __importDefault(require("../operations/submitRulesForSmartAppOperation"));
const createTransitionRuleFromConfigOperation_1 = __importDefault(require("../operations/createTransitionRuleFromConfigOperation"));
/* eslint-disable no-magic-numbers */
const offset8AM = 60 * -4;
const offset8PM = 60 * 8;
const offset6Hours = 360;
const offset12Hours = 720;
const defaultDayLevel = 50;
const defaultNightLevel = 15;
const increment5 = 5;
const increment15 = 15;
/* eslint-enable no-magic-numbers */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const contextStore = new file_context_store_1.default(db_1.default.dataDirectory);
const ruleStore = new simple_json_db_1.default(db_1.default.ruleStorePath, { asyncWrite: true });
const rulesAreModified = (ruleStoreKey, newDayRule, newNightRule, newIdleRule, newTransitionRule) => {
    const existingRules = ruleStore.get(ruleStoreKey);
    return (!existingRules ||
        JSON.stringify(newDayRule) !== JSON.stringify(existingRules.dayLightRule) ||
        JSON.stringify(newNightRule) !== JSON.stringify(existingRules.nightLightRule) ||
        JSON.stringify(newIdleRule) !== JSON.stringify(existingRules.idleRule) ||
        JSON.stringify(newTransitionRule) !== JSON.stringify(existingRules.transitionRule));
};
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
    // prompts user to select a contact sensor
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
        section.numberSetting('dayStartOffset')
            .min(-offset12Hours)
            .max(offset12Hours)
            .step(increment15)
            .defaultValue(0);
        // slider would be nice, but UI provides no numerical feedback, so worthless =\
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
        // from 8PM
        section.numberSetting('dayNightOffset')
            .min(-offset12Hours)
            .max(offset12Hours)
            .step(increment15)
            .defaultValue(0);
        // slider would be nice, but UI provides no numerical feedback, so worthless =\
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
        // from 8AM
        section.numberSetting('nightEndOffset')
            .min(-offset12Hours)
            .max(offset12Hours)
            .step(increment15)
            .defaultValue(0);
        // slider would be nice, but UI provides no numerical feedback, so worthless =\
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
    });
    // i know this does something, even though apparently the typedefs say otherwise
    // eslint-disable-next-line @typescript-eslint/await-thenable
    yield page.section('levels', (section) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        section.hideable(true);
        try {
            const allDimmableSwitches = yield Promise.all((yield ((_a = context.api.devices) === null || _a === void 0 ? void 0 : _a.list({ capability: 'switchLevel' }))) || []);
            const daySwitches = ((_b = (yield context.configDevices('dayControlSwitch'))) !== null && _b !== void 0 ? _b : []).concat((_c = (yield context.configDevices('dayActiveSwitches'))) !== null && _c !== void 0 ? _c : [])
                .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
            const nightSwitches = ((_d = (yield context.configDevices('nightControlSwitch'))) !== null && _d !== void 0 ? _d : []).concat((_e = (yield context.configDevices('nightActiveSwitches'))) !== null && _e !== void 0 ? _e : [])
                .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
            const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
            const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
            dayDimmableSwitches.forEach(s => {
                section.numberSetting(`dayLevel${s.deviceId}`)
                    .name(`${s.label} Day Dimming Level`)
                    .min(10)
                    .max(100)
                    .step(increment5)
                    .defaultValue(defaultDayLevel);
                // slider would be nice, but UI provides no numerical feedback, so worthless =\
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
            });
            nightDimmableSwitches.forEach(s => {
                section.numberSetting(`nightLevel${s.deviceId}`)
                    .name(`${s.label} Night Dimming Level`)
                    .min(10)
                    .max(100)
                    .step(increment5)
                    .defaultValue(defaultNightLevel);
                // slider would be nice, but UI provides no numerical feedback, so worthless =\
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
            });
        }
        catch (_f) {
            // this happens on app installation, you have not authorized any scopes yet, so the api calls implicit above will fail
        }
    }));
}))
    .updated((context, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k, _l;
    const appKey = `app-${updateData.installedApp.installedAppId}`;
    const newConfig = context.config;
    let allDimmableSwitches;
    let daySwitches;
    let nightSwitches;
    try {
        allDimmableSwitches = yield Promise.all((yield ((_g = context.api.devices) === null || _g === void 0 ? void 0 : _g.list({ capability: 'switchLevel' }))) || []);
        daySwitches = ((_h = newConfig.dayControlSwitch) !== null && _h !== void 0 ? _h : []).concat((_j = newConfig.dayActiveSwitches) !== null && _j !== void 0 ? _j : []) // next line filters out duplicate device ids between the 2 arrays
            .filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i);
        nightSwitches = ((_k = newConfig.nightControlSwitch) !== null && _k !== void 0 ? _k : []).concat((_l = newConfig.nightActiveSwitches) !== null && _l !== void 0 ? _l : []) // next line filters out duplicate device ids between the 2 arrays
            .filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i);
    }
    catch (_m) {
        // this also happens before you have authorized scopes in the app during initial installation
        return;
    }
    const getSwitchLevel = (s, configPrefix, defaultLevel) => {
        if (!newConfig[`dayLevel${s.deviceConfig.deviceId}`]) {
            return defaultLevel;
        }
        return parseInt((newConfig[`${configPrefix}${s.deviceConfig.deviceId}`][0]).stringConfig.value, 10);
    };
    const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId));
    const dayDimmableSwitchLevels = dayDimmableSwitches.map(s => ({ deviceId: s.deviceConfig.deviceId, switchLevel: getSwitchLevel(s, 'dayLevel', defaultDayLevel) }));
    const dayNonDimmableSwitches = daySwitches.filter(s => !dayDimmableSwitches.find(ss => s.deviceConfig.deviceId === ss.deviceConfig.deviceId));
    const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId));
    const nightDimmableSwitchLevels = nightDimmableSwitches.map(s => ({ deviceId: s.deviceConfig.deviceId, switchLevel: getSwitchLevel(s, 'nightLevel', defaultNightLevel) }));
    const nightNonDimmableSwitches = nightSwitches.filter(s => !nightDimmableSwitches.find(ss => s.deviceConfig.deviceId === ss.deviceConfig.deviceId));
    const dayRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule');
    const nightRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableNightlightRule');
    const idleRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableIdleRule');
    const transitionRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule') && context.configBooleanValue('enableNightlightRule');
    /* eslint-disable no-mixed-operators */
    const newDayRule = dayRuleEnabled && (0, createTriggerRuleFromConfigOperation_1.default)(`${appKey}-daylight`, offset8AM + parseInt(newConfig.dayStartOffset[0].stringConfig.value, 10), offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value, 10), newConfig.motionSensor.map(m => m.deviceConfig.deviceId), newConfig.dayControlSwitch[0].deviceConfig.deviceId, dayDimmableSwitchLevels, dayNonDimmableSwitches.map(s => s.deviceConfig.deviceId), context.configBooleanValue('motionMultipleAll'), parseInt(newConfig.motionDurationDelay[0].stringConfig.value, 10)) || null;
    const newNightRule = nightRuleEnabled && (0, createTriggerRuleFromConfigOperation_1.default)(`${appKey}-nightlight`, offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value, 10), offset8AM + parseInt(newConfig.nightEndOffset[0].stringConfig.value, 10), newConfig.motionSensor.map(m => m.deviceConfig.deviceId), newConfig.nightControlSwitch[0].deviceConfig.deviceId, nightDimmableSwitchLevels, nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId), context.configBooleanValue('motionMultipleAll'), parseInt(newConfig.motionDurationDelay[0].stringConfig.value, 10)) || null;
    const newIdleRule = idleRuleEnabled && (0, createIdleRuleFromConfigOperation_1.default)(`${appKey}-idle`, newConfig.motionSensor.map(m => m.deviceConfig.deviceId), daySwitches.concat(nightSwitches).filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i).map(s => s.deviceConfig.deviceId), parseInt(newConfig.motionIdleTimeout[0].stringConfig.value, 10), context.configBooleanValue('motionIdleTimeoutUnit') ? core_sdk_1.IntervalUnit.Minute : core_sdk_1.IntervalUnit.Second, !context.configBooleanValue('motionMultipleAll') // you invert this setting for the idle case
    ) || null;
    const newTransitionRule = transitionRuleEnabled && (0, createTransitionRuleFromConfigOperation_1.default)(`${appKey}-trans`, offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value, 10), daySwitches.map(s => s.deviceConfig.deviceId), nightDimmableSwitchLevels, nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId)) || null;
    /* eslint-enable no-mixed-operators */
    if (rulesAreModified(appKey, newDayRule, newNightRule, newIdleRule, newTransitionRule)) {
        yield (0, submitRulesForSmartAppOperation_1.default)(context.api, ruleStore, appKey, newDayRule, newNightRule, newIdleRule, newTransitionRule);
    }
    else {
        // eslint-disable-next-line no-console
        console.log('Rules not modified, nothing to update');
    }
}));
//# sourceMappingURL=smartAppRule.js.map