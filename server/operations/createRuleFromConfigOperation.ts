import { RuleRequest } from "@smartthings/core-sdk";
import { generateConditionDeviceOff,generateActionSwitchOn, generateActionSwitchLevel, generateConditionMotion, generateConditionBetween } from "../factories/ruleFactory";

const createRuleFromConfig = ( 
	ruleLabel: string,
	startOffset: number,
	endOffset: number,
	motionControlDeviceId: string,
	controlDeviceId: string,
	activeSwitchLevelDeviceIds: string[],
	activeSwitchOnDeviceIds: string[]
	) => {
		const betweenCondition = generateConditionBetween(startOffset, endOffset);
		const motionCondition = generateConditionMotion(motionControlDeviceId);
		const controlSwitchCondition = generateConditionDeviceOff(controlDeviceId);
		const switchDimmableActions = activeSwitchLevelDeviceIds.map( s => {
			return generateActionSwitchLevel(s, 50);
		});
		const switchOnActions = activeSwitchOnDeviceIds.map( s => {
			return generateActionSwitchOn(s);
		});

		const newRule: RuleRequest = {
			name: `${ruleLabel}`,
			actions: [
				{
					if: {
						and: [
							betweenCondition, 
							motionCondition,
							controlSwitchCondition
						],
						then: switchDimmableActions.concat(switchOnActions)
					}
				}
			]
		};

		return newRule;
};

export default createRuleFromConfig;