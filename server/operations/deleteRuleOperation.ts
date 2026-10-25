import {parseRuleAppKey} from '../factories/ruleFactory';
import ruleStore from '../provider/ruleStore';
import getSmartThingsClient from '../provider/smartThingsClient';

/**
 * Deletes one SmartThings rule (the dashboard's per-rule delete). When the rule belongs to a rule SmartApp install,
 * its id is also removed from that install's saved rule data - otherwise the saved data keeps listing a rule that no
 * longer exists (shown as a "saved rule data still lists..." notice on the Rules page).
 */
const deleteRuleOperation = async (locationId: string, ruleId: string): Promise<void> => {
  const client = getSmartThingsClient();
  // read the name before deleting - it's the only link back to the owning install
  const rule = await client.rules.get(ruleId, locationId);
  await client.rules.delete(ruleId, locationId);

  const installedAppId = parseRuleAppKey(rule.name);
  const stored = installedAppId ? await ruleStore.get(installedAppId) : null;
  if (!installedAppId || !stored) {
    return;
  }
  stored.newRuleSummary.ruleIds = stored.newRuleSummary.ruleIds.filter(id => id !== ruleId);
  // these two are only ever written, but keep them consistent with the rule being gone
  if (stored.combinedRuleId === ruleId) {
    stored.combinedRuleId = null;
  }
  if (stored.transitionRuleId === ruleId) {
    stored.transitionRuleId = null;
  }
  await ruleStore.set(stored, installedAppId);
};

export default deleteRuleOperation;
