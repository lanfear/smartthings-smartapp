"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = __importDefault(require("../constants/global"));
const ruleFactory_1 = require("../factories/ruleFactory");
const createTransitionRuleFromConfig = (appKey, transitionOffset, dayActiveSwitchDeviceIds, nightActiveSwitchLevelDeviceLevelMap, nightActiveSwitchOnDeviceIds) => {
    const ruleLabel = `${appKey}-transition-rule`;
    // get active day switches that are not also night switches
    const dayOnlyActiveSwitchIds = dayActiveSwitchDeviceIds.filter(ds => ![...nightActiveSwitchOnDeviceIds, ...nightActiveSwitchLevelDeviceLevelMap.map(ns => ns.deviceId)].some(ns => ns === ds));
    const switchOnConditions = dayActiveSwitchDeviceIds.map(s => (0, ruleFactory_1.generateConditionDeviceOn)(s));
    const switchOffActions = dayOnlyActiveSwitchIds.length > 0 ? [(0, ruleFactory_1.generateActionSwitchOff)(dayOnlyActiveSwitchIds)] : [];
    const switchDimmableActions = nightActiveSwitchLevelDeviceLevelMap.map(s => (0, ruleFactory_1.generateActionSwitchLevel)(s.deviceId, s.switchLevel, global_1.default.rule.default.switchLevelRate));
    const switchOnActions = nightActiveSwitchOnDeviceIds.map(s => (0, ruleFactory_1.generateActionSwitchOn)(s));
    const triggerActions = [{
            if: {
                or: switchOnConditions,
                then: switchOffActions.concat(switchDimmableActions).concat(switchOnActions)
            }
        }];
    return {
        name: `${ruleLabel}`,
        actions: [(0, ruleFactory_1.generateConditionTrigger)(transitionOffset, triggerActions)]
    };
};
exports.default = createTransitionRuleFromConfig;
//# sourceMappingURL=createTransitionRuleFromConfigOperation.js.map