import {createClient} from 'redis';
import redisErrorListener from './redisErrorListener';
import settings from './settings';

// one hash holding every pending timed re-enable: field = `${installedAppId}:${ruleComponent}`, value = IReEnableEntry JSON.
// Persisted so a server restart can restore its timers, and so the rule app's config page can show when a pause ends
const reEnableKey = 'st-reenable';

export interface IReEnableEntry {
  locationId: string;
  installedAppId: string;
  ruleComponent: string; // IRuleComponentType | 'all'
  reEnableAt: number; // epoch ms
}

const redisReEnableStore = createClient({
  url: settings.redisServer
});
redisReEnableStore.on('error', redisErrorListener('reEnableStore'));

const getClient = async (): Promise<typeof redisReEnableStore> => {
  if (!redisReEnableStore.isOpen) {
    await redisReEnableStore.connect();
  }
  return redisReEnableStore;
};

const fieldName = (installedAppId: string, ruleComponent: string): string => `${installedAppId}:${ruleComponent}`;

const list = async (): Promise<IReEnableEntry[]> => {
  const client = await getClient();
  return Object.values(await client.hGetAll(reEnableKey)).map(v => JSON.parse(v) as IReEnableEntry);
};

const listForApp = async (installedAppId: string): Promise<IReEnableEntry[]> => (await list()).filter(e => e.installedAppId === installedAppId);

const set = async (entry: IReEnableEntry): Promise<void> => {
  const client = await getClient();
  await client.hSet(reEnableKey, fieldName(entry.installedAppId, entry.ruleComponent), JSON.stringify(entry));
};

/** remove the pending re-enable of one rule component, or of every component when `ruleComponent` is omitted */
const remove = async (installedAppId: string, ruleComponent?: string): Promise<void> => {
  const client = await getClient();
  const fields = ruleComponent
    ? [fieldName(installedAppId, ruleComponent)]
    : (await listForApp(installedAppId)).map(e => fieldName(e.installedAppId, e.ruleComponent));
  if (fields.length > 0) {
    await client.hDel(reEnableKey, fields);
  }
};

export default {
  list,
  listForApp,
  set,
  remove
};
