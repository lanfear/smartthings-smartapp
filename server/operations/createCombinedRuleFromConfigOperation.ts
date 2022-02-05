import {Action, RuleRequest} from '@smartthings/core-sdk';

const createCombinedRuleFromConfig = (
  appKey: string,
  dayTriggerAction: Action,
  nightTriggerAction: Action,
  idleAction: Action
): RuleRequest => {
  const ruleLabel = `${appKey}-rule`;

  if (!dayTriggerAction && !nightTriggerAction && !idleAction) {
    return null;
  }

  // array of rules excluding nulls
  const actions = [dayTriggerAction, nightTriggerAction, idleAction].filter(a => a);

  return {
    name: `${ruleLabel}`,
    actions: actions
  };
};

export default createCombinedRuleFromConfig;