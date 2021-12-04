import {IntervalUnit, Action} from '@smartthings/core-sdk';
import {
  generateConditionNoMotion,
  generateActionSwitchOff,
  generateActionSleep
} from '../factories/ruleFactory';

const createIdleRuleFromConfig = (
  motionControlDeviceIds: string[],
  activeSwitchDeviceIds: string[],
  idleTimeoutDelay: number,
  idleTimeoutUnit: IntervalUnit,
  motionMultipleAll: boolean
): Action => {
  const idleCondition = generateConditionNoMotion(motionControlDeviceIds, motionMultipleAll);
  const sleepAction = generateActionSleep(idleTimeoutDelay, idleTimeoutUnit);
    
  if (idleTimeoutDelay <= 0) {
    return {
      if: {
        and: [idleCondition],
        then: [generateActionSwitchOff(activeSwitchDeviceIds)]
      }
    } as Action;
  }

  const newRule: Action = {
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
  };

  return newRule;
};

export default createIdleRuleFromConfig;