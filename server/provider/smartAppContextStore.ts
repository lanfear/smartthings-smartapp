import {ContextRecord, ContextStore} from '@smartthings/smartapp';
import {createClient} from 'redis';

// TODO: this should take the appid as an arg & constructor
const appContextPrefix = `st-appcontext-${process.env.ENV_TYPE}-`;
const redisContextStore = createClient({
  url: process.env.REDIS_SERVER
});

type RedisContextRecord = ContextRecord & Record<string, any>;

const store: ContextStore = {
  get: async installedAppId => {
    await redisContextStore.connect();
    const appRecord = JSON.parse(await redisContextStore.get(`${appContextPrefix}${installedAppId}`)) as RedisContextRecord;
    await redisContextStore.quit();
    return appRecord;
  },
  put: async contextRecord => {
    await redisContextStore.connect();
    await redisContextStore.set(`${appContextPrefix}${contextRecord.installedAppId}`, JSON.stringify(contextRecord));
    await redisContextStore.quit();
    return contextRecord;
  }
};

export default store;
