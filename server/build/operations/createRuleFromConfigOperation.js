"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_sdk_1 = require("@smartthings/core-sdk");
const global_1 = __importDefault(require("../constants/global"));
const ruleFactory_1 = require("../factories/ruleFactory");
const createTriggerRuleFromConfig = (ruleLabel, startOffset, endOffset, motionControlDeviceIds, controlDeviceId, activeSwitchLevelDeviceLevelMap, activeSwitchOnDeviceIds, motionMultipleAll, motionDurationDelay) => {
    const betweenCondition = (0, ruleFactory_1.generateConditionBetween)(startOffset, endOffset);
    const motionCondition = (0, ruleFactory_1.generateConditionMotion)(motionControlDeviceIds, motionMultipleAll);
    const controlSwitchCondition = (0, ruleFactory_1.generateConditionDeviceOff)(controlDeviceId);
    const switchDimmableActions = activeSwitchLevelDeviceLevelMap.map(s => (0, ruleFactory_1.generateActionSwitchLevel)(s.deviceId, s.switchLevel, global_1.default.rule.default.switchLevelRate));
    const switchOnActions = activeSwitchOnDeviceIds.map(s => (0, ruleFactory_1.generateActionSwitchOn)(s));
    const sleepAction = (0, ruleFactory_1.generateActionSleep)(motionDurationDelay, core_sdk_1.IntervalUnit.Second);
    if (motionDurationDelay <= 0) {
        return {
            name: `${ruleLabel}`,
            actions: [{
                    if: {
                        and: [
                            betweenCondition,
                            motionCondition,
                            controlSwitchCondition
                        ],
                        then: switchDimmableActions.concat(switchOnActions)
                    }
                }]
        };
    }
    return {
        name: `${ruleLabel}`,
        actions: [{
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
            }]
    };
};
exports.default = createTriggerRuleFromConfig;
//# sourceMappingURL=createRuleFromConfigOperation.js.map