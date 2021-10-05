import {RuleRequest} from '@smartthings/core-sdk';
import global from '../constants/global';
import {
    generateConditionDeviceOff,
    generateConditionMotion,
    generateConditionBetween,
    generateActionSwitchOn,
    generateActionSwitchLevel
} from '../factories/ruleFactory';
import {IRuleSwitchLevelInfo} from '../types';

const createRuleFromConfig = (
    ruleLabel: string,
    startOffset: number,
    endOffset: number,
    motionControlDeviceIds: string[],
    controlDeviceId: string,
    activeSwitchLevelDeviceLevelMap: IRuleSwitchLevelInfo[],
    activeSwitchOnDeviceIds: string[],
    motionMultipleAll: boolean
): RuleRequest => {
    const betweenCondition = generateConditionBetween(startOffset, endOffset);
    const motionCondition = generateConditionMotion(motionControlDeviceIds, motionMultipleAll);
    const controlSwitchCondition = generateConditionDeviceOff(controlDeviceId);
    const switchDimmableActions = activeSwitchLevelDeviceLevelMap.map(s => generateActionSwitchLevel(s.deviceId, s.switchLevel, global.rule.default.switchLevelRate));
    const switchOnActions = activeSwitchOnDeviceIds.map(s => generateActionSwitchOn(s));

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