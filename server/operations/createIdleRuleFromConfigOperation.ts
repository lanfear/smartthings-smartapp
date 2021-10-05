import {IntervalUnit, RuleRequest} from '@smartthings/core-sdk';
import {
    generateConditionNoMotion,
    generateActionSwitchOff,
    generateActionSleep
} from '../factories/ruleFactory';

const createIdleRuleFromConfig = (
    ruleLabel: string,
    motionControlDeviceIds: string[],
    activeSwitchDeviceIds: string[],
    idleTimeoutDelay: number,
    idleTimeoutUnit: IntervalUnit,
    motionMultipleAll: boolean
): RuleRequest => {
    const idleCondition = generateConditionNoMotion(motionControlDeviceIds, motionMultipleAll);
    const sleepAction = generateActionSleep(idleTimeoutDelay, idleTimeoutUnit);
    
    if (idleTimeoutDelay <= 0) {
        return {
            name: `${ruleLabel}`,
            actions: [{
                if: {
                    and: [idleCondition],
                    then: [generateActionSwitchOff(activeSwitchDeviceIds)]
                }
            }]
        } as RuleRequest;
    }

    const newRule: RuleRequest = {
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
                                then: [generateActionSwitchOff(activeSwitchDeviceIds)]
                            }
                        }
                    ]
                }
            }
        ]
    };

    return newRule;
};

export default createIdleRuleFromConfig;