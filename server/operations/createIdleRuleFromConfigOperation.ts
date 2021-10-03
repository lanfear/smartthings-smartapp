import { IntervalUnit, RuleRequest } from "@smartthings/core-sdk";
import { 
    generateConditionNoMotion, 
    generateActionSwitchOff,
    generateActionSleep
} from "../factories/ruleFactory";

const createIdleRuleFromConfig = ( 
	ruleLabel: string,
	motionControlDeviceId: string,
	activeSwitchDeviceIds: string[],
    idleTimeoutDelay: number
	) => {
        const idleCondition = generateConditionNoMotion(motionControlDeviceId);
        const sleepAction = generateActionSleep(idleTimeoutDelay, IntervalUnit.Minute)
    
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