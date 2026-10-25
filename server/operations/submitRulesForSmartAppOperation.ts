import type {RuleRequest, SmartThingsClient} from '@smartthings/core-sdk';
import type {IRuleSummary, Nullable} from 'types/sharedContracts';

const submitRules = async (client: SmartThingsClient, locationId: string, smartAppLookupKey: string, combinedRule: Nullable<RuleRequest>, transitionRule: Nullable<RuleRequest>, newRuleSummary: IRuleSummary): Promise<[IRuleSummary, Nullable<string>, Nullable<string>]> => {
  /* eslint-disable no-console */
  console.log('Submitting Rules', locationId);
  console.log('Main Rule', JSON.stringify(combinedRule));
  console.log('Transition Rule', JSON.stringify(transitionRule));
  /* eslint-enable no-console */

  try {
    const existingRules = await client.rules.list(locationId);
    // drop saved ids of rules that no longer exist (deleted outside this app, e.g. in the SmartThings app) - nothing
    // else ever removes them, so they'd otherwise pile up in the rule store forever
    const existingRuleIds = new Set(existingRules.map(r => r.id));
    newRuleSummary.ruleIds = newRuleSummary.ruleIds.filter(rid => existingRuleIds.has(rid));
    await Promise.allSettled(
      existingRules
        .filter(r => r.name.includes(smartAppLookupKey))
        .map(async r => {
          await client.rules.delete(r.id, locationId);
          newRuleSummary.ruleIds = newRuleSummary.ruleIds.filter(rid => rid !== r.id);
        }));
  } catch (e) {
    throw new Error(`Failed to delete existing rules, aborting submitRules operation: [${e as Error}]`);
  }

  const newCombinedRuleResponse = combinedRule ? await client.rules.create(combinedRule, locationId) : null;
  const newTransitionRuleResponse = transitionRule ? await client.rules.create(transitionRule, locationId) : null;
  const newRuleIds = [newCombinedRuleResponse?.id, newTransitionRuleResponse?.id].filter(id => !!id);
  newRuleSummary.ruleIds.push(...newRuleIds.filter(id => id) as string[]);

  // console.log('Applied Rules', newCombinedRuleResponse?.actions, newTransitionRuleResponse?.actions);

  return [newRuleSummary, newCombinedRuleResponse?.id ?? null, newTransitionRuleResponse?.id ?? null];
};

export default submitRules;
