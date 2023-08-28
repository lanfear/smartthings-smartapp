import {ContextRecord, ContextStore} from '@smartthings/smartapp';
import {createClient} from 'redis';

const createStore = (automationId: string): ContextStore => {
  const redisContextStore = createClient({
    url: process.env.REDIS_SERVER
  });
  const appContextPrefix = `st-appcontext-${automationId}-`;

  return {
    get: async installedAppId => {
      await redisContextStore.connect();
      const appRecord = JSON.parse(await redisContextStore.get(`${appContextPrefix}${installedAppId}`)) as ContextRecord;
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
};

export default createStore;
