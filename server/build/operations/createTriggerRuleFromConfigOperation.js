"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_sdk_1 = require("@smartthings/core-sdk");
const global_1 = __importDefault(require("../constants/global"));
const ruleFactory_1 = require("../factories/ruleFactory");
// eslint-disable-next-line no-magic-numbers
const _24hours = 24 * 60;
const createTriggerRuleFromConfig = (startOffset, endOffset, motionControlDeviceIds, controlDeviceId, activeSwitchLevelDeviceLevelMap, activeSwitchOnDeviceIds, motionMultipleAll, motionDurationDelay) => {
    if (endOffset < startOffset) {
        endOffset += _24hours;
    }
    const betweenCondition = (0, ruleFactory_1.generateConditionBetween)(startOffset, endOffset);
    const motionCondition = (0, ruleFactory_1.generateConditionMotion)(motionControlDeviceIds, motionMultipleAll);
    const controlSwitchCondition = (0, ruleFactory_1.generateConditionDeviceOff)(controlDeviceId);
    const switchDimmableActions = activeSwitchLevelDeviceLevelMap.map(s => (0, ruleFactory_1.generateActionSwitchLevel)(s.deviceId, s.switchLevel, global_1.default.rule.default.switchLevelRate));
    const switchOnActions = activeSwitchOnDeviceIds.map(s => (0, ruleFactory_1.generateActionSwitchOn)(s));
    const sleepAction = (0, ruleFactory_1.generateActionSleep)(motionDurationDelay, core_sdk_1.IntervalUnit.Second);
    if (motionDurationDelay <= 0) {
        return {
            if: {
                and: [
                    betweenCondition,
                    motionCondition,
                    controlSwitchCondition
                ],
                then: switchDimmableActions.concat(switchOnActions)
            }
        };
    }
    return {
        if: {
            and: [
                betweenCondition,
                motionCondition,
                controlSwitchCondition
            ],
            then: [
                sleepAction,
                {
                    if: {
                        and: [
                            motionCondition,
                            controlSwitchCondition
                        ],
                        then: switchDimmableActions.concat(switchOnActions)
                    }
                }
            ]
        }
    };
};
exports.default = createTriggerRuleFromConfig;
//# sourceMappingURL=createTriggerRuleFromConfigOperation.js.map