/* eslint-disable no-mixed-operators */
import {RuleRequest, SmartThingsClient} from '@smartthings/core-sdk';
import JSONdb from 'simple-json-db';
import {RuleStoreInfo} from '../types';

const submitRules = async (api: SmartThingsClient, ruleStore: JSONdb, smartAppLookupKey: string, rule: RuleRequest): Promise<void> => {
  /* eslint-disable no-console */
  console.log('Submitting Rules');
  console.log('Rule', JSON.stringify(rule));
  /* eslint-enable no-console */

  await Promise.all(
    (await api.rules?.list() || [])
      .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
      .map(async r => await api.rules.delete(r.id)));

  const newRuleInfo: RuleStoreInfo = {
    rule
  };
    
  const newRuleResponse = rule && await api.rules.create(rule) || null;
  newRuleInfo.ruleId = newRuleResponse?.id;

  // eslint-disable-next-line no-console
  console.log('Applied Rules', await api.rules.list());
};

export default submitRules;