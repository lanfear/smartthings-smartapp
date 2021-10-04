import { RuleRequest } from "@smartthings/core-sdk";
import { 
    generateConditionDeviceOff, 
    generateConditionMotion, 
    generateConditionBetween,
    generateActionSwitchOn,
    generateActionSwitchLevel,
} from "../factories/ruleFactory";
import { IRuleSwitchLevelInfo } from "../types";

const createRuleFromConfig = ( 
	ruleLabel: string,
	startOffset: number,
	endOffset: number,
	motionControlDeviceIds: string[],
	controlDeviceId: string,
	activeSwitchLevelDeviceLevelMap: IRuleSwitchLevelInfo[],
	activeSwitchOnDeviceIds: string[],
	motionMultipleAll: boolean
	) => {
		const betweenCondition = generateConditionBetween(startOffset, endOffset);
		const motionCondition = generateConditionMotion(motionControlDeviceIds, motionMultipleAll);
		const controlSwitchCondition = generateConditionDeviceOff(controlDeviceId);
		const switchDimmableActions = activeSwitchLevelDeviceLevelMap.map( s => {
			return generateActionSwitchLevel(s.deviceId, s.switchLevel, 20);
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