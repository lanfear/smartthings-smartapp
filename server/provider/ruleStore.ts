import {createClient} from 'redis';
import type {Nullable, RuleStoreInfo} from 'types';
import settings from './settings';

const ruleInfoPrefix = 'st-ruleinfo-';
const redisRuleStore = createClient({
  url: settings.redisServer
});

// pre-existing renamed keys (see git history 'align the names of these vars on the server'); kept only so older stored rule
// summaries can be migrated forward instead of silently losing whatever temp-disable state was set via the web dashboard
const legacyTempDisableFieldNames = {
  tempDisableDaylightRule: 'temporaryDisableDaylightRule',
  tempDisableNightlightRule: 'temporaryDisableNightlightRule',
  tempDisableIdleRule: 'temporaryDisableIdleRule',
  tempDisableTransitionRule: 'temporaryDisableTransitionRule'
} as const;

// older stored rule summaries may predate these fields entirely, or store them under the legacy names above;
// normalize so callers always get real booleans instead of `undefined`
const backfillTempDisableFields = (ruleStoreInfo: RuleStoreInfo): void => {
  const ruleSummary = ruleStoreInfo.newRuleSummary as unknown as Record<string, boolean | undefined>;
  ruleSummary.tempDisableAllRules ??= false;
  Object.entries(legacyTempDisableFieldNames).forEach(([currentName, legacyName]) => {
    ruleSummary[currentName] ??= ruleSummary[legacyName] ?? false;
    delete ruleSummary[legacyName];
  });
};

// none of this was working, maybe have to deal with it someday, but :shrug: we dont have that many open redis connections, can clean itself
// const cleanup = async (): Promise<void> => {
//   if (redisRuleStore.isOpen) {
//     /* eslint-disable no-console */
//     console.log('Redis client stopping...');
//     await redisRuleStore.disconnect();
//     /* eslint-enabe no-console */
//     console.log('Redis client stopped.');
//   }
// };

// process.on('SIGINT', cleanup);
// process.on('SIGTERM', cleanup);

const get = async (ruleStoreKey: string): Promise<Nullable<RuleStoreInfo>> => {
  if (!redisRuleStore.isOpen) {
    await redisRuleStore.connect();
  }
  const ruleStoreInfoString = await redisRuleStore.get(`${ruleInfoPrefix}${ruleStoreKey}`);
  if (!ruleStoreInfoString) {
    return null;
  }
  const ruleStoreInfo = JSON.parse(ruleStoreInfoString) as RuleStoreInfo;
  backfillTempDisableFields(ruleStoreInfo);
  // console.log('redis rule', !!ruleStoreInfoRedis, 'looking for', `${ruleInfoPrefix}${ruleStoreKey}`);
  return ruleStoreInfo;
};

const set = async (ruleStoreInfo: RuleStoreInfo, ruleStoreKey: string): Promise<void> => {
  if (!redisRuleStore.isOpen) {
    await redisRuleStore.connect();
  }
  // console.log('setting redis rule key', `${ruleInfoPrefix}${ruleStoreKey}`);
  await redisRuleStore.set(`${ruleInfoPrefix}${ruleStoreKey}`, JSON.stringify(ruleStoreInfo));
};

const deleteRule = async (ruleStoreKey: string): Promise<void> => {
  if (!redisRuleStore.isOpen) {
    await redisRuleStore.connect();
  }
  // console.log('deleting redis rule key', `${ruleInfoPrefix}${ruleStoreKey}`);
  await redisRuleStore.del(`${ruleInfoPrefix}${ruleStoreKey}`);
};

export default {
  get: get,
  set: set,
  delete: deleteRule
};
