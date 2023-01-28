import {RuleRequest} from '@smartthings/core-sdk';
import JSONdb from 'simple-json-db';
import sse from '../provider/sse';
import {IRuleSummary, ISseRuleEvent} from 'sharedContracts';
import {RuleStoreInfo} from '../types';

const sendSSEEvent = (data: ISseRuleEvent): void => {
  sse.send(JSON.stringify(data), 'rule');
};

const storeRulesAndNotifyOperation = (ruleStore: JSONdb<RuleStoreInfo>, smartAppLookupKey: string, combinedRule: RuleRequest, combinbedRuleId: string, transitionRule: RuleRequest, transitionRuleId: string, newRuleSummary: IRuleSummary): void => {
  const newRuleInfo: RuleStoreInfo = {
    combinedRule: combinedRule,
    combinedRuleId: combinbedRuleId,
    transitionRule: transitionRule,
    transitionRuleId: transitionRuleId,
    newRuleSummary: newRuleSummary
  };

  ruleStore.set(smartAppLookupKey, newRuleInfo);

  sendSSEEvent({
    appId: smartAppLookupKey,
    ruleSummary: newRuleSummary
  });
};

export default storeRulesAndNotifyOperation;

