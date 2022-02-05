"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ruleFactory_1 = require("../factories/ruleFactory");
const createIdleRuleFromConfig = (motionControlDeviceIds, activeSwitchDeviceIds, idleTimeoutDelay, idleTimeoutUnit, motionMultipleAll) => {
    const idleConditions = (0, ruleFactory_1.generateConditionsNoMotion)(motionControlDeviceIds);
    const sleepAction = (0, ruleFactory_1.generateActionSleep)(idleTimeoutDelay, idleTimeoutUnit);
    const finalIfAction = {
        then: [(0, ruleFactory_1.generateActionSwitchOff)(activeSwitchDeviceIds)]
    };
    if (motionMultipleAll) {
        finalIfAction.and = idleConditions;
    }
    else {
        finalIfAction.or = idleConditions;
    }
    if (idleTimeoutDelay <= 0) {
        return {
            if: finalIfAction
        };
    }
    const newRule = {
        if: {
            then: [
                sleepAction,
                {
                    if: finalIfAction
                }
            ]
        }
    };
    if (motionMultipleAll) {
        newRule.if.and = idleConditions;
    }
    else {
        newRule.if.or = idleConditions;
    }
    return newRule;
};
exports.default = createIdleRuleFromConfig;
//# sourceMappingURL=createIdleRuleFromConfigOperation.js.map