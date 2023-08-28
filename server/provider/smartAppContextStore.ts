import {ContextRecord, ContextStore} from '@smartthings/smartapp';
import {createClient} from 'redis';

const redisContextStore = createClient({
  url: process.env.REDIS_SERVER
});

const cleanup = async (): Promise<void> => {
  /* eslint-disable no-console */
  console.log('Redis client stopping...');
  await redisContextStore.quit();
  console.log('Redis client stopped.');
  /* eslint-enabe no-console */
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const createStore = (automationId: string): ContextStore => {
  const appContextPrefix = `st-appcontext-${automationId}-`;

  return {
    get: async installedAppId => {
      await redisContextStore.connect();
      const appRecord = JSON.parse(await redisContextStore.get(`${appContextPrefix}${installedAppId}`)) as ContextRecord;
      await redisContextStore.disconnect();
      return appRecord;
    },
    put: async contextRecord => {
      await redisContextStore.connect();
      await redisContextStore.set(`${appContextPrefix}${contextRecord.installedAppId}`, JSON.stringify(contextRecord));
      await redisContextStore.disconnect();
      return contextRecord;
    }
  };
};

export default createStore;
