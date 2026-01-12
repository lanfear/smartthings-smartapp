import type {RuleRequest} from '@smartthings/core-sdk';
import type {IRuleSummary, ISseRuleEvent} from 'types/sharedContracts';
import ruleStore from '../provider/ruleStore';
import sse from '../provider/sse';
import type {Nullable, RuleStoreInfo} from '../types';

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
    appId: `app-${smartAppLookupKey}`, // TODO: is this right or does it need 'app-' prefix
    ruleSummary: newRuleSummary
  });
};

export default storeRulesAndNotifyOperation;
