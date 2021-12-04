import {Action, RuleRequest} from '@smartthings/core-sdk';

const createCombinedRuleFromConfig = (
  appKey: string,
  dayTriggerAction: Action,
  nightTriggerAction: Action,
  idleAction: Action,
  transitionAction: Action
): RuleRequest => {
  const ruleLabel = `${appKey}-rule`;

  if (!dayTriggerAction && !nightTriggerAction && !idleAction && !transitionAction) {
    return null;
  }

  // ugg, annoying, cant think of slicker way to chain these yet
  const actions: Action[] = [];
  dayTriggerAction && actions.push(dayTriggerAction);
  nightTriggerAction && actions.push(nightTriggerAction);
  idleAction && actions.push(idleAction);
  transitionAction && actions.push(transitionAction);

  return {
    name: `${ruleLabel}`,
    actions: actions
  };
};

export default createCombinedRuleFromConfig;