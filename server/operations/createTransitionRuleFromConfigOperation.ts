import {RuleRequest} from '@smartthings/core-sdk';
import {IRuleSwitchLevelInfo} from '../types';
import global from '../constants/global';
import {
  generateConditionTrigger,
  generateConditionDeviceOn,
  generateActionSwitchOn,
  generateActionSwitchOff,
  generateActionSwitchLevel
} from '../factories/ruleFactory';

const createTransitionRuleFromConfig = (
  appKey: string,
  transitionOffset: number,
  dayActiveSwitchDeviceIds: string[],
  nightActiveSwitchLevelDeviceLevelMap: IRuleSwitchLevelInfo[],
  nightActiveSwitchOnDeviceIds: string[]
): RuleRequest => {
  const ruleLabel = `${appKey}-transition-rule`;

  // get active day switches that are not also night switches
  const dayOnlyActiveSwitchIds = dayActiveSwitchDeviceIds.filter(ds => ![...nightActiveSwitchOnDeviceIds, ...nightActiveSwitchLevelDeviceLevelMap.map(ns => ns.deviceId)].some(ns => ns === ds));
  const switchOnConditions = dayActiveSwitchDeviceIds.map(s => generateConditionDeviceOn(s));
  const switchOffActions = dayOnlyActiveSwitchIds.length > 0 ? [generateActionSwitchOff(dayOnlyActiveSwitchIds)] : [];
  const switchDimmableActions = nightActiveSwitchLevelDeviceLevelMap.map(s => generateActionSwitchLevel(s.deviceId, s.switchLevel, global.rule.default.switchLevelRate));
  const switchOnActions = nightActiveSwitchOnDeviceIds.map(s => generateActionSwitchOn(s));

  const triggerActions = [{
    if: {
      or: switchOnConditions,
      then: switchOffActions.concat(switchDimmableActions).concat(switchOnActions)
    }
  }];

  return {
    name: `${ruleLabel}`,
    actions: [generateConditionTrigger(transitionOffset, triggerActions)]
  };
};

export default createTransitionRuleFromConfig;