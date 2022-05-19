/* eslint-disable no-mixed-operators */
import sse from '../provider/sse';
import {RuleRequest, SmartThingsClient} from '@smartthings/core-sdk';
import JSONdb from 'simple-json-db';
import {RuleStoreInfo} from '../types';
import {IRuleSummary, ISseRuleEvent} from 'sharedContracts';

const sendSSEEvent = (data: ISseRuleEvent): void => {
  sse.send(JSON.stringify(data), 'rule');
};

const submitRules = async (client: SmartThingsClient, ruleStore: JSONdb, locationId: string, smartAppLookupKey: string, combinedRule: RuleRequest, transitionRule: RuleRequest, newRuleSummary: IRuleSummary): Promise<void> => {
  /* eslint-disable no-console */
  console.log('Submitting Rules');
  console.log('Rule', JSON.stringify(combinedRule));
  /* eslint-enable no-console */

  // TODO: after all existing rules are cleared, this can go
  // await Promise.all(
  //   (await api.rules?.list() || [])
  //     .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
  //     .map(async r => await api.rules.delete(r.id)));

  await Promise.all(
    (await client.rules?.list(locationId) || [])
      .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
      .map(async r => {
        await client.rules.delete(r.id, locationId);
        newRuleSummary.ruleIds = newRuleSummary.ruleIds.filter(rid => rid !== r.id);
      }));
  
  const newCombinedRuleResponse = combinedRule && await client.rules.create(combinedRule, locationId) || null;
  const newTransitionRuleResponse = transitionRule && await client.rules.create(transitionRule, locationId) || null;
  const newRuleIds = [newCombinedRuleResponse?.id, newTransitionRuleResponse?.id].filter(id => !!id);
  newRuleSummary.ruleIds.push(...newRuleIds);
  
  const newRuleInfo: RuleStoreInfo = {
    combinedRule: combinedRule,
    combinedRuleId: newCombinedRuleResponse?.id,
    transitionRule: transitionRule,
    transitionRuleId: newTransitionRuleResponse?.id,
    newRuleSummary: newRuleSummary
  };

  // eslint-disable-next-line no-console
  console.log('Applied Rules', newCombinedRuleResponse?.actions, newTransitionRuleResponse?.actions);

  ruleStore.set(smartAppLookupKey, newRuleInfo);

  sendSSEEvent({
    appId: smartAppLookupKey,
    ruleSummary: newRuleSummary
  });
};

export default submitRules;