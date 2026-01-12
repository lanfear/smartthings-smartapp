import {RuleRequest, RuleAction} from '@smartthings/core-sdk';
import {Nullable} from 'types';

const createCombinedRuleFromConfig = (
  appKey: string,
  dayTriggerAction: Nullable<RuleAction>,
  nightTriggerAction: Nullable<RuleAction>,
  idleAction: Nullable<RuleAction>
): Nullable<RuleRequest> => {
  const ruleLabel = `${appKey}-rule`;

  if (!dayTriggerAction && !nightTriggerAction && !idleAction) {
    return null;
  }

  // array of rules excluding nulls
  const actions = [dayTriggerAction, nightTriggerAction, idleAction].filter(a => a) as RuleAction[];

  return {
    name: `${ruleLabel}`,
    actions: actions
  };
};

export default createCombinedRuleFromConfig;
