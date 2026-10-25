import {createClient} from 'redis';
import type {IMeasurementHistoryPoint, IMeasurementType} from 'types/sharedContracts';
import settings from './settings';

// one sorted set per device component + measurement: score = epoch ms, member = `${epoch}:${value}`.
// re-recording the same sensor report produces the same member, so polling more often than a sensor reports is a no-op
const seriesPrefix = 'st-measurement-';
const backfilledPrefix = 'st-measurement-backfilled-';
const hoursPerDay = 24;
const msPerDay = hoursPerDay * 60 * 60 * 1000;

const redisMeasurementStore = createClient({
  url: settings.redisServer
});

const getClient = async (): Promise<typeof redisMeasurementStore> => {
  if (!redisMeasurementStore.isOpen) {
    await redisMeasurementStore.connect();
  }
  return redisMeasurementStore;
};

const seriesKey = (locationId: string, measurement: IMeasurementType, deviceId: string, componentId: string): string => `${seriesPrefix}${locationId}-${measurement}-${deviceId}-${componentId}`;

const parseMember = (member: string): IMeasurementHistoryPoint | null => {
  const separator = member.indexOf(':');
  const epoch = Number(member.substring(0, separator));
  const value = Number(member.substring(separator + 1));
  return separator > 0 && Number.isFinite(epoch) && Number.isFinite(value) ? {epoch, value} : null;
};

/** store points for one series and drop anything older than the retention window */
const addPoints = async (locationId: string, measurement: IMeasurementType, deviceId: string, componentId: string, points: IMeasurementHistoryPoint[]): Promise<void> => {
  if (!points.length) {
    return;
  }
  const client = await getClient();
  const key = seriesKey(locationId, measurement, deviceId, componentId);
  await client.zAdd(key, points.map(p => ({score: p.epoch, value: `${p.epoch}:${p.value}`})));
  await client.zRemRangeByScore(key, '-inf', Date.now() - (settings.measurementRetentionDays * msPerDay));
};

/** points for one series recorded at or after `since`, oldest first */
const getPoints = async (locationId: string, measurement: IMeasurementType, deviceId: string, componentId: string, since: number): Promise<IMeasurementHistoryPoint[]> => {
  const client = await getClient();
  const members = await client.zRangeByScore(seriesKey(locationId, measurement, deviceId, componentId), since, '+inf');
  return members.map(parseMember).filter((p): p is IMeasurementHistoryPoint => !!p);
};

const isBackfilled = async (locationId: string): Promise<boolean> => !!(await (await getClient()).get(`${backfilledPrefix}${locationId}`));

const markBackfilled = async (locationId: string): Promise<void> => {
  await (await getClient()).set(`${backfilledPrefix}${locationId}`, new Date().toISOString());
};

export default {
  addPoints,
  getPoints,
  isBackfilled,
  markBackfilled
};
