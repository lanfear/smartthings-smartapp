import {IntervalUnit, RuleRequest} from '@smartthings/core-sdk';
import global from '../constants/global';
import {
  generateConditionDeviceOff,
  generateConditionMotion,
  generateConditionBetween,
  generateActionSwitchOn,
  generateActionSwitchLevel,
  generateActionSleep
} from '../factories/ruleFactory';
import {IRuleSwitchLevelInfo} from '../types';

const createTriggerRuleFromConfig = (
  ruleLabel: string,
  startOffset: number,
  endOffset: number,
  motionControlDeviceIds: string[],
  controlDeviceId: string,
  activeSwitchLevelDeviceLevelMap: IRuleSwitchLevelInfo[],
  activeSwitchOnDeviceIds: string[],
  motionMultipleAll: boolean,
  motionDurationDelay: number
): RuleRequest => {
  const betweenCondition = generateConditionBetween(startOffset, endOffset);
  const motionCondition = generateConditionMotion(motionControlDeviceIds, motionMultipleAll);
  const controlSwitchCondition = generateConditionDeviceOff(controlDeviceId);
  const switchDimmableActions = activeSwitchLevelDeviceLevelMap.map(s => generateActionSwitchLevel(s.deviceId, s.switchLevel, global.rule.default.switchLevelRate));
  const switchOnActions = activeSwitchOnDeviceIds.map(s => generateActionSwitchOn(s));
  const sleepAction = generateActionSleep(motionDurationDelay, IntervalUnit.Second);

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

export default createTriggerRuleFromConfig;