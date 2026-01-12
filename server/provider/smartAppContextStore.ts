import type {ContextRecord, ContextStore} from '@smartthings/smartapp';
import {createClient} from 'redis';

// this is the full interface of context store, the type is incorrect
export interface ContextStoreExtended extends ContextStore {
  update: (installedAppId: string, contextRecord: ContextRecord) => Promise<ContextRecord>;
  delete: (installedAppId: string) => Promise<ContextRecord>;
}

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

export const listInstalledApps = async (): Promise<string[]> => {
  if (!redisContextStore.isOpen) {
    await redisContextStore.connect();
  }
  // guid regex: [0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}
  const installedAppIds = (await redisContextStore.keys('st-appcontext-*')).map(k => k.replace(/^st-appcontext-.*-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/, '$1'));
  return installedAppIds;
};

const createStore = (automationId: string): ContextStoreExtended => {
  const appContextPrefix = `st-appcontext-${automationId}-`;

  return {
    get: async installedAppId => {
      if (!redisContextStore.isOpen) {
        await redisContextStore.connect();
      }
      const appRecordText = await redisContextStore.get(`${appContextPrefix}${installedAppId}`);
      const appRecord = (appRecordText ? JSON.parse(appRecordText) : null as unknown) as ContextRecord;
      return appRecord;
    },
    put: async contextRecord => {
      if (!redisContextStore.isOpen) {
        await redisContextStore.connect();
      }
      await redisContextStore.set(`${appContextPrefix}${contextRecord.installedAppId}`, JSON.stringify(contextRecord));
      return contextRecord;
    },
    update: async (installedAppId, contextRecord) => {
      if (!redisContextStore.isOpen) {
        await redisContextStore.connect();
      }
      await redisContextStore.set(`${appContextPrefix}${installedAppId}`, JSON.stringify(contextRecord));
      return contextRecord;
    },
    delete: async installedAppId => {
      if (!redisContextStore.isOpen) {
        await redisContextStore.connect();
      }
      const contextRecord = JSON.parse((await redisContextStore.get(`${appContextPrefix}${installedAppId}`))!) as ContextRecord;
      await redisContextStore.del(`${appContextPrefix}${installedAppId}`);
      return contextRecord;
    }
  };
};

export default createStore;
