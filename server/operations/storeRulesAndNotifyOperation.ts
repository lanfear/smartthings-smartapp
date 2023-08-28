import {RuleRequest} from '@smartthings/core-sdk';
import sse from '../provider/sse';
import {IRuleSummary, ISseRuleEvent} from 'sharedContracts';
import {RuleStoreInfo} from '../types';
import ruleStore from '../provider/ruleStore';

const sendSSEEvent = (data: ISseRuleEvent): void => {
  sse.send(JSON.stringify(data), 'rule');
};

const storeRulesAndNotifyOperation = async (smartAppLookupKey: string, combinedRule: RuleRequest, combinbedRuleId: string, transitionRule: RuleRequest, transitionRuleId: string, newRuleSummary: IRuleSummary): Promise<void> => {
  const newRuleInfo: RuleStoreInfo = {
    combinedRule: combinedRule,
    combinedRuleId: combinbedRuleId,
    transitionRule: transitionRule,
    transitionRuleId: transitionRuleId,
    newRuleSummary: newRuleSummary
  };

  await ruleStore.set(newRuleInfo, smartAppLookupKey);

  sendSSEEvent({
    appId: `app-${smartAppLookupKey}`, // TODO: is this right or does it need 'app-' prefix
    ruleSummary: newRuleSummary
  });
};

export default storeRulesAndNotifyOperation;
