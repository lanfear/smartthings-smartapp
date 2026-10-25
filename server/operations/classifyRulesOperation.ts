import type {InstalledApp, Rule} from '@smartthings/core-sdk';
import type {RuleStoreInfo} from 'types';
import type {IRuleHealth, Nullable} from 'types/sharedContracts';
import {parseRuleAppKey} from '../factories/ruleFactory';

export interface IRuleClassification {
  healthByRuleId: Map<string, IRuleHealth>;
  // per install: rule ids its saved rule data lists as current that no longer exist in SmartThings
  missingRuleIdsByApp: Map<string, string[]>;
}

/**
 * Cross-references every rule in a location against the rule SmartApp installs (see IRuleHealthStatus): which
 * install a rule's name says it belongs to, whether that install still exists, and whether the rule is one of the
 * ids the install saved as its current rules. Pure - callers supply the SmartThings rules, installs and rule store data.
 */
const classifyRulesOperation = (rules: Rule[], installedApps: InstalledApp[], storedRulesByApp: Map<string, Nullable<RuleStoreInfo>>): IRuleClassification => {
  const appNames = new Map(installedApps.map(a => [a.installedAppId, a.displayName ?? a.installedAppId]));

  const healthByRuleId = new Map(rules.map((rule): [string, IRuleHealth] => {
    const installedAppId = parseRuleAppKey(rule.name);
    if (!installedAppId) {
      return [rule.id, {status: 'external', installedAppId: null, installedAppName: null, currentRuleIds: []}];
    }
    const installedAppName = appNames.get(installedAppId) ?? null;
    const currentRuleIds = storedRulesByApp.get(installedAppId)?.newRuleSummary.ruleIds ?? [];
    const status = installedAppName === null
      ? 'orphaned'
      : !storedRulesByApp.get(installedAppId)
        ? 'untracked'
        : currentRuleIds.includes(rule.id) ? 'ok' : 'staleDuplicate';
    return [rule.id, {status, installedAppId, installedAppName, currentRuleIds}];
  }));

  const existingRuleIds = new Set(rules.map(r => r.id));
  const missingRuleIdsByApp = new Map([...storedRulesByApp].flatMap(([installedAppId, stored]) => {
    const missing = (stored?.newRuleSummary.ruleIds ?? []).filter(id => !existingRuleIds.has(id));
    return missing.length ? [[installedAppId, missing] as const] : [];
  }));

  return {healthByRuleId, missingRuleIdsByApp};
};

export default classifyRulesOperation;
