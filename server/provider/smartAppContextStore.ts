import {ContextRecord, ContextStore} from '@smartthings/smartapp';
import {createClient} from 'redis';

const redisContextStore = createClient({
  url: process.env.REDIS_SERVER
});

// none of this was working, maybe have to deal with it someday, but :shrug: we dont have that many open redis connections, can clean itself up
// const cleanup = async (): Promise<void> => {
//   if (redisContextStore.isOpen) {
//     /* eslint-disable no-console */
//     console.log('Redis client stopping...');
//     await redisContextStore.disconnect();
//     /* eslint-enabe no-console */
//     console.log('Redis client stopped.');
//   }
// };

// process.on('SIGINT', cleanup);
// process.on('SIGTERM', cleanup);

const createStore = (automationId: string): ContextStore => {
  const appContextPrefix = `st-appcontext-${automationId}-`;

  return {
    get: async installedAppId => {
      if (!redisContextStore.isOpen) {
        await redisContextStore.connect();
      }
      const appRecord = JSON.parse(await redisContextStore.get(`${appContextPrefix}${installedAppId}`)) as ContextRecord;
      return appRecord;
    },
    put: async contextRecord => {
      if (!redisContextStore.isOpen) {
        await redisContextStore.connect();
      }
      await redisContextStore.set(`${appContextPrefix}${contextRecord.installedAppId}`, JSON.stringify(contextRecord));
      return contextRecord;
    }
  };
};

export default createStore;
