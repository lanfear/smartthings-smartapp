import type {ISseRuleEvent} from 'types/sharedContracts';
import {generateRuleAppKey} from '../factories/ruleFactory';
import ruleStore from '../provider/ruleStore';
import getSmartThingsClient from '../provider/smartThingsClient';
import sse from '../provider/sse';
import {cancelReEnableRuleTimers} from './reEnableRuleAfterDelayOperation';

/* eslint-disable no-console */

/**
 * Deletes every SmartThings rule a rule SmartApp install created, plus its rule store entry and any pending timed
 * re-enable. The rules are created with API_TOKEN, so they're owned by the user rather than the install and SmartThings
 * doesn't remove them when the app is uninstalled - this does. Rules are matched by the install's key in their name
 * (the same lookup submitRulesForSmartAppOperation uses), so rules the rule store lost track of are caught too.
 * Best effort: a failed delete is logged and the rest still go. Returns how many rules were deleted.
 */
const deleteRulesForSmartAppOperation = async (locationId: string, installedAppId: string): Promise<number> => {
  // a timer firing after this would try to re-enable rules for an install that no longer exists
  cancelReEnableRuleTimers(locationId, installedAppId);

  const client = getSmartThingsClient();
  const appKey = generateRuleAppKey(installedAppId);
  const rules = (await client.rules.list(locationId)).filter(r => r.name.includes(appKey));
  const results = await Promise.allSettled(rules.map(async r => {
    await client.rules.delete(r.id, locationId);
  }));
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn('Failed to delete rule [', rules[i].id, '] [', rules[i].name, '] for uninstalled app [', installedAppId, ']', result.reason);
    }
  });

  const storedRules = await ruleStore.get(installedAppId);
  await ruleStore.delete(installedAppId);

  // open dashboards refetch location data on any 'rule' event, which drops the deleted rules from view
  if (storedRules) {
    const event: ISseRuleEvent = {appId: appKey, ruleSummary: storedRules.newRuleSummary};
    sse.send(JSON.stringify(event), 'rule');
  }

  return results.filter(r => r.status === 'fulfilled').length;
};

export default deleteRulesForSmartAppOperation;
