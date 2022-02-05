/* eslint-disable no-mixed-operators */
import {RuleRequest, SmartThingsClient} from '@smartthings/core-sdk';
import JSONdb from 'simple-json-db';
import {RuleStoreInfo} from '../types';

const submitRules = async (api: SmartThingsClient, ruleStore: JSONdb, smartAppLookupKey: string, combinedRule: RuleRequest, transitionRule: RuleRequest): Promise<void> => {
  /* eslint-disable no-console */
  console.log('Submitting Rules');
  console.log('Rule', JSON.stringify(combinedRule));
  /* eslint-enable no-console */

  await Promise.all(
    (await api.rules?.list() || [])
      .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
      .map(async r => await api.rules.delete(r.id)));

  // this object and the return from the rules calls below are currently unused... but the rule guid may be interesting to stash away someday
  const newRuleInfo: RuleStoreInfo = {
    combinedRule,
    transitionRule
  };
    
  const newCombinedRuleResponse = combinedRule && await api.rules.create(combinedRule) || null;
  newRuleInfo.combinedRuleId = newCombinedRuleResponse?.id;
  const newTransitionRuleResponse = transitionRule && await api.rules.create(transitionRule) || null;
  newRuleInfo.transitionRuleId = newTransitionRuleResponse?.id;

  // eslint-disable-next-line no-console
  console.log('Applied Rules', await api.rules.list());
};

export default submitRules;