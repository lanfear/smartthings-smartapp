import {createClient} from 'redis';
import type {Nullable, RuleStoreInfo} from 'types';
import settings from './settings';

const ruleInfoPrefix = 'st-ruleinfo-';
const redisRuleStore = createClient({
  url: settings.redisServer
});

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
