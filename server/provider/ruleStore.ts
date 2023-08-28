import {RuleStoreInfo} from 'index';
import {createClient} from 'redis';
import JSONdb from 'simple-json-db';
import db from './db';

const ruleInfoPrefix = `st-ruleinfo-${process.env.ENV_TYPE}-`;
const ruleStore = new JSONdb<RuleStoreInfo>(db.ruleStorePath, {asyncWrite: true});
const redisRuleStore = createClient({
  url: process.env.REDIS_SERVER
});

const get = async (ruleStoreKey: string): Promise<RuleStoreInfo|null> => {
  await redisRuleStore.connect();
  const ruleStoreInfoRedis = JSON.parse(await redisRuleStore.get(`${ruleInfoPrefix}${ruleStoreKey}`)) as RuleStoreInfo;
  await redisRuleStore.quit();
  console.log('redis rule', !!ruleStoreInfoRedis);
  const ruleStoreInfo = ruleStore.get(`app-${ruleStoreKey}`);
  return ruleStoreInfo;
};

const set = async (ruleStoreInfo: RuleStoreInfo, ruleStoreKey: string): Promise<void> => {
  ruleStore.set(`app-${ruleStoreKey}`, ruleStoreInfo);
  await redisRuleStore.connect();
  // console.log('setting redis rule key', `${ruleInfoPrefix}${ruleStoreKey}`);
  await redisRuleStore.set(`${ruleInfoPrefix}${ruleStoreKey}`, JSON.stringify(ruleStoreInfo));
  await redisRuleStore.quit();
};

export default {
  get,
  set
};