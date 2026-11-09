import type {RuleRequest, SmartThingsClient} from '@smartthings/core-sdk';
import type {IRuleSummary, Nullable} from 'types/sharedContracts';

const submitRules = async (client: SmartThingsClient, locationId: string, smartAppLookupKey: string, combinedRule: Nullable<RuleRequest>, transitionRule: Nullable<RuleRequest>, newRuleSummary: IRuleSummary): Promise<[IRuleSummary, Nullable<string>, Nullable<string>]> => {
  /* eslint-disable no-console */
  console.log('Submitting Rules', locationId);
  console.log('Main Rule', JSON.stringify(combinedRule));
  console.log('Transition Rule', JSON.stringify(transitionRule));
  /* eslint-enable no-console */

  try {
    const appRules = (await client.rules.list(locationId)).filter(r => r.name.includes(smartAppLookupKey));
    const results = await Promise.allSettled(appRules.map(async r => await client.rules.delete(r.id, locationId)));
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        // the rule may still exist - if so the Rules page flags it as a stale duplicate (matched by name)
        // eslint-disable-next-line no-console
        console.warn('Failed to delete existing rule [', appRules[i].id, '] for [', smartAppLookupKey, ']', result.reason);
      }
    });
  } catch (e) {
    throw new Error(`Failed to delete existing rules, aborting submitRules operation: [${e as Error}]`);
  }

  const newCombinedRuleResponse = combinedRule ? await client.rules.create(combinedRule, locationId) : null;
  const newTransitionRuleResponse = transitionRule ? await client.rules.create(transitionRule, locationId) : null;
  // the install's current rules are exactly the ones just created - replace rather than append, so ids of old rules
  // (whose delete failed or raced another rebuild) can't linger in the rule store
  newRuleSummary.ruleIds = [newCombinedRuleResponse?.id, newTransitionRuleResponse?.id].filter((id): id is string => !!id);

  // console.log('Applied Rules', newCombinedRuleResponse?.actions, newTransitionRuleResponse?.actions);

  return [newRuleSummary, newCombinedRuleResponse?.id ?? null, newTransitionRuleResponse?.id ?? null];
};

export default submitRules;
