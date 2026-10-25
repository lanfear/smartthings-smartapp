import type {RuleRequest} from '@smartthings/core-sdk';
import type {IRuleSummary, ISseRuleEvent, Nullable} from 'types/sharedContracts';
import {generateRuleAppKey} from '../factories/ruleFactory';
import ruleStore from '../provider/ruleStore';
import sse from '../provider/sse';
import type {RuleStoreInfo} from '../types';

const sendSSEEvent = (data: ISseRuleEvent): void => {
  sse.send(JSON.stringify(data), 'rule');
};

const storeRulesAndNotifyOperation = async (smartAppLookupKey: string, combinedRule: Nullable<RuleRequest>, combinbedRuleId: Nullable<string>, transitionRule: Nullable<RuleRequest>, transitionRuleId: Nullable<string>, newRuleSummary: IRuleSummary): Promise<void> => {
  const newRuleInfo: RuleStoreInfo = {
    combinedRule: combinedRule,
    combinedRuleId: combinbedRuleId,
    transitionRule: transitionRule,
    transitionRuleId: transitionRuleId,
    newRuleSummary: newRuleSummary
  };

  await ruleStore.set(newRuleInfo, smartAppLookupKey);

  sendSSEEvent({
    appId: generateRuleAppKey(smartAppLookupKey),
    ruleSummary: newRuleSummary
  });
};

export default storeRulesAndNotifyOperation;
