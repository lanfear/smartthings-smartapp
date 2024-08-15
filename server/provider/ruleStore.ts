import {RuleStoreInfo} from 'index';
import {createClient} from 'redis';

// TODO: drop JSONdb

const ruleInfoPrefix = 'st-ruleinfo-';
const redisRuleStore = createClient({
  url: process.env.REDIS_SERVER
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

const get = async (ruleStoreKey: string): Promise<RuleStoreInfo | null> => {
  if (!redisRuleStore.isOpen) {
    await redisRuleStore.connect();
  }
  const ruleStoreInfoRedis = JSON.parse(await redisRuleStore.get(`${ruleInfoPrefix}${ruleStoreKey}`)) as RuleStoreInfo;
  // console.log('redis rule', !!ruleStoreInfoRedis, 'looking for', `${ruleInfoPrefix}${ruleStoreKey}`);
  return ruleStoreInfoRedis;
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
