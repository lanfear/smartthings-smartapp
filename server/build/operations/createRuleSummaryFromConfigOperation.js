"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const noonHour = 12;
const createRuleSummaryFromConfig = (config, uniqueDaySwitches, dayDimmableSwitches, dayNonDimmableSwitches, dayDimmableSwitchLevels, uniqueNightSwitches, nightDimmableSwitches, nightNonDimmableSwitches, nightDimmableSwitchLevels, installedAppId, ruleIds) => {
    const dayStartTime = (0, dayjs_1.default)().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayStartOffset, 'minutes');
    const dayNightTime = (0, dayjs_1.default)().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayNightOffset, 'minutes');
    const nightEndTime = (0, dayjs_1.default)().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.nightEndOffset, 'minutes');
    return {
        dayControlSwitch: config.dayControlSwitch,
        daySwitches: uniqueDaySwitches,
        dayDimmableSwitches: dayDimmableSwitches,
        dayNonDimmableSwitches: dayNonDimmableSwitches,
        dayDimmableSwitchLevels: dayDimmableSwitchLevels,
        nightControlSwitch: config.nightControlSwitch,
        nightSwitches: uniqueNightSwitches,
        nightDimmableSwitches: nightDimmableSwitches,
        nightNonDimmableSwitches: nightNonDimmableSwitches,
        nightDimmableSwitchLevels: nightDimmableSwitchLevels,
        motionSensors: config.motionSensors,
        motionIdleTimeout: config.motionIdleTimeout,
        motionIdleTimeoutUnit: config.motionIdleTimeoutUnit,
        motionDurationDelay: config.motionDurationDelay,
        dayStartTime: dayStartTime.toJSON(),
        dayNightTime: dayNightTime.toJSON(),
        nightEndTime: nightEndTime.toJSON(),
        enableAllRules: config.enableAllRules,
        enableDaylightRule: config.enableDaylightRule,
        enableNightlightRule: config.enableNightlightRule,
        enableIdleRule: config.enableIdleRule,
        enableTransitionRule: config.enableDaylightRule && config.enableNightlightRule,
        installedAppId: installedAppId,
        ruleIds: ruleIds
    };
};
exports.default = createRuleSummaryFromConfig;
//# sourceMappingURL=createRuleSummaryFromConfigOperation.js.map