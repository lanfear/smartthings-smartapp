import {IntervalUnit, Action, IfAction} from '@smartthings/core-sdk';
import {
  generateConditionsNoMotion,
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
  const idleConditions = generateConditionsNoMotion(motionControlDeviceIds);
  const sleepAction = generateActionSleep(idleTimeoutDelay, idleTimeoutUnit);

  const finalIfAction: IfAction = {
    then: [generateActionSwitchOff(activeSwitchDeviceIds)]
  };

  if (motionMultipleAll) {
    finalIfAction.and = idleConditions;
  } else {
    finalIfAction.or = idleConditions;
  }
    
  if (idleTimeoutDelay <= 0) {
    return {
      if: finalIfAction
    };
  }

  const newRule: Action = {
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
  } else {
    newRule.if.or = idleConditions;
  }

  return newRule;
};

export default createIdleRuleFromConfig;