import {RuleRequest} from '@smartthings/core-sdk';
import JSONdb from 'simple-json-db';
import sse from '../provider/sse';
import {createClient} from 'redis';
import {IRuleSummary, ISseRuleEvent} from 'sharedContracts';
import {RuleStoreInfo} from '../types';

const sendSSEEvent = (data: ISseRuleEvent): void => {
  sse.send(JSON.stringify(data), 'rule');
};

const storeRulesAndNotifyOperation = async (ruleStore: JSONdb<RuleStoreInfo>, ruleStoreRedis: ReturnType<typeof createClient>, smartAppLookupKey: string, combinedRule: RuleRequest, combinbedRuleId: string, transitionRule: RuleRequest, transitionRuleId: string, newRuleSummary: IRuleSummary): Promise<void> => {
  const newRuleInfo: RuleStoreInfo = {
    combinedRule: combinedRule,
    combinedRuleId: combinbedRuleId,
    transitionRule: transitionRule,
    transitionRuleId: transitionRuleId,
    newRuleSummary: newRuleSummary
  };

  ruleStore.set(smartAppLookupKey, newRuleInfo);
  await ruleStoreRedis.json.set(smartAppLookupKey, '.', newRuleInfo);

  sendSSEEvent({
    appId: smartAppLookupKey,
    ruleSummary: newRuleSummary
  });
};

export default storeRulesAndNotifyOperation;
