import type {RuleAction} from '@smartthings/core-sdk';
import global from '../constants/global';
import {
  generateConditionDeviceOff,
  generateConditionMotion,
  generateConditionBetween,
  generateActionSwitchOn,
  generateActionSwitchLevel,
  generateActionSleep
} from '../factories/ruleFactory';
import type {IRuleSwitchLevelInfo} from '../types/sharedContracts';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const _24hours = 24 * 60;

const createTriggerRuleFromConfig = (
  startOffset: number,
  endOffset: number,
  motionControlDeviceIds: string[],
  controlDeviceId: string,
  activeSwitchLevelDeviceLevelMap: IRuleSwitchLevelInfo[],
  activeSwitchOnDeviceIds: string[],
  motionMultipleAll: boolean,
  motionDurationDelay: number
): RuleAction => {
  if (endOffset < startOffset) {
    endOffset += _24hours;
  }
  const betweenCondition = generateConditionBetween(startOffset, endOffset);
  const motionCondition = generateConditionMotion(motionControlDeviceIds, motionMultipleAll);
  const controlSwitchCondition = generateConditionDeviceOff(controlDeviceId);
  const switchDimmableActions = activeSwitchLevelDeviceLevelMap.map(s => generateActionSwitchLevel(s.deviceId, s.switchLevel, global.rule.default.switchLevelRate));
  const switchOnActions = activeSwitchOnDeviceIds.map(s => generateActionSwitchOn(s));
  const sleepAction = generateActionSleep(motionDurationDelay, 'Second');

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

export default createTriggerRuleFromConfig;
