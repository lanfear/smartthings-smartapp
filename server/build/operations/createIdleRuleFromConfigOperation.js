"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ruleFactory_1 = require("../factories/ruleFactory");
const createIdleRuleFromConfig = (ruleLabel, motionControlDeviceIds, activeSwitchDeviceIds, idleTimeoutDelay, idleTimeoutUnit, motionMultipleAll) => {
    const idleCondition = (0, ruleFactory_1.generateConditionNoMotion)(motionControlDeviceIds, motionMultipleAll);
    const sleepAction = (0, ruleFactory_1.generateActionSleep)(idleTimeoutDelay, idleTimeoutUnit);
    if (idleTimeoutDelay <= 0) {
        return {
            name: `${ruleLabel}`,
            actions: [{
                    if: {
                        and: [idleCondition],
                        then: [(0, ruleFactory_1.generateActionSwitchOff)(activeSwitchDeviceIds)]
                    }
                }]
        };
    }
    const newRule = {
        name: `${ruleLabel}`,
        actions: [
            {
                if: {
                    and: [idleCondition],
                    then: [
                        sleepAction,
                        {
                            if: {
                                and: [idleCondition],
                                then: [(0, ruleFactory_1.generateActionSwitchOff)(activeSwitchDeviceIds)]
                            }
                        }
                    ]
                }
            }
        ]
    };
    return newRule;
};
exports.default = createIdleRuleFromConfig;
//# sourceMappingURL=createIdleRuleFromConfigOperation.js.map