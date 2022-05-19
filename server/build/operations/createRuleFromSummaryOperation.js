"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransitionRuleFromSummary = exports.createCombinedRuleFromSummary = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const uniqueDeviceFactory_1 = __importDefault(require("../factories/uniqueDeviceFactory"));
const createCombinedRuleFromConfigOperation_1 = __importDefault(require("./createCombinedRuleFromConfigOperation"));
const createIdleRuleFromConfigOperation_1 = __importDefault(require("./createIdleRuleFromConfigOperation"));
const createTransitionRuleFromConfigOperation_1 = __importDefault(require("./createTransitionRuleFromConfigOperation"));
const createTriggerRuleFromConfigOperation_1 = __importDefault(require("./createTriggerRuleFromConfigOperation"));
dayjs_1.default.extend(utc_1.default);
const createCombinedRuleFromSummary = (ruleSummary) => {
    if (!ruleSummary || !ruleSummary.enableAllRules) {
        return null;
    }
    const dayStartTime = (0, dayjs_1.default)(ruleSummary.dayStartTime).utc().diff((0, dayjs_1.default)(ruleSummary.dayStartTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers
    const dayNightTime = (0, dayjs_1.default)(ruleSummary.dayNightTime).utc().diff((0, dayjs_1.default)(ruleSummary.dayNightTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers
    const nightEndTime = (0, dayjs_1.default)(ruleSummary.nightEndTime).utc().diff((0, dayjs_1.default)(ruleSummary.nightEndTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers
    const uniqueSwitches = (0, uniqueDeviceFactory_1.default)(ruleSummary.daySwitches.concat(ruleSummary.nightSwitches));
    /* eslint-disable no-mixed-operators */
    const newDayRule = ruleSummary.enableDaylightRule && !ruleSummary.temporaryDisableDaylightRule && (0, createTriggerRuleFromConfigOperation_1.default)(dayStartTime, dayNightTime, ruleSummary.motionSensors.map(d => d.deviceId), ruleSummary.dayControlSwitch.deviceId, ruleSummary.dayDimmableSwitchLevels, ruleSummary.dayNonDimmableSwitches.map(s => s.deviceId), ruleSummary.motionMultipleAll, ruleSummary.motionDurationDelay) || null;
    const newNightRule = ruleSummary.enableNightlightRule && !ruleSummary.temporaryDisableNightlightRule && (0, createTriggerRuleFromConfigOperation_1.default)(dayNightTime, nightEndTime, ruleSummary.motionSensors.map(d => d.deviceId), ruleSummary.nightControlSwitch.deviceId, ruleSummary.nightDimmableSwitchLevels, ruleSummary.nightNonDimmableSwitches.map(s => s.deviceId), ruleSummary.motionMultipleAll, ruleSummary.motionDurationDelay) || null;
    const newIdleRule = ruleSummary.enableIdleRule && !ruleSummary.temporaryDisableIdleRule && (0, createIdleRuleFromConfigOperation_1.default)(ruleSummary.motionSensors.map(d => d.deviceId), uniqueSwitches.map(d => d.deviceId), ruleSummary.motionIdleTimeout, ruleSummary.motionIdleTimeoutUnit, !ruleSummary.motionMultipleAll // you invert this setting for the idle case
    ) || null;
    const appKey = `app-${ruleSummary.installedAppId}`;
    return (0, createCombinedRuleFromConfigOperation_1.default)(appKey, newDayRule, newNightRule, newIdleRule);
};
exports.createCombinedRuleFromSummary = createCombinedRuleFromSummary;
const createTransitionRuleFromSummary = (ruleSummary) => {
    if (!ruleSummary || !ruleSummary.enableAllRules) {
        return null;
    }
    const dayNightTime = (0, dayjs_1.default)(ruleSummary.dayNightTime).utc().diff((0, dayjs_1.default)(ruleSummary.dayNightTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers
    const appKey = `app-${ruleSummary.installedAppId}`;
    return ruleSummary.enableTransitionRule && !ruleSummary.temporaryDisableTransitionRule && (0, createTransitionRuleFromConfigOperation_1.default)(appKey, dayNightTime, ruleSummary.daySwitches.map(s => s.deviceId), ruleSummary.nightDimmableSwitchLevels, ruleSummary.nightNonDimmableSwitches.map(s => s.deviceId)) || null;
    /* eslint-enable no-mixed-operators */
};
exports.createTransitionRuleFromSummary = createTransitionRuleFromSummary;
//# sourceMappingURL=createRuleFromSummaryOperation.js.map