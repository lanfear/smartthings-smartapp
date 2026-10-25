import {createClient} from 'redis';
import type {IMeasurementHistoryPoint, IMeasurementType} from 'types/sharedContracts';
import settings from './settings';

// one sorted set per device component + measurement: score = epoch ms, member = `${epoch}:${value}`.
// re-recording the same sensor report produces the same member, so polling more often than a sensor reports is a no-op
const seriesPrefix = 'st-measurement-';
// one sorted set per device of its health state *changes*: score = epoch ms, member = `${epoch}:${state}`
const healthPrefix = 'st-measurement-health-';
const backfilledPrefix = 'st-measurement-backfilled-';
const hoursPerDay = 24;
const msPerDay = hoursPerDay * 60 * 60 * 1000;

export interface IHealthChange {
  epoch: number;
  state: string; // 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
}

export interface IHealthHistory {
  stateAtSince: string | null; // state in effect at `since` (null when nothing was recorded before it)
  changes: IHealthChange[]; // changes at or after `since`, oldest first
}

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
const healthKey = (locationId: string, deviceId: string): string => `${healthPrefix}${locationId}-${deviceId}`;

const splitMember = (member: string): [number, string] | null => {
  const separator = member.indexOf(':');
  const epoch = Number(member.substring(0, separator));
  return separator > 0 && Number.isFinite(epoch) ? [epoch, member.substring(separator + 1)] : null;
};

const parsePoint = (member: string): IMeasurementHistoryPoint | null => {
  const parts = splitMember(member);
  const value = parts ? Number(parts[1]) : NaN;
  return parts && Number.isFinite(value) ? {epoch: parts[0], value: value} : null;
};

const parseHealth = (member: string): IHealthChange | null => {
  const parts = splitMember(member);
  return parts ? {epoch: parts[0], state: parts[1]} : null;
};

// most recent member strictly before `before` - REV + BY SCORE takes (max, min); '(' makes the bound exclusive
const getLastMemberBefore = async (key: string, before: number): Promise<string | undefined> => {
  const [member] = await (await getClient()).zRange(key, `(${before}`, '-inf', {BY: 'SCORE', REV: true, LIMIT: {offset: 0, count: 1}});
  return member;
};

// drop entries older than the retention window, but keep the newest of them: it's still the value/state in effect at
// the window start (a sensor that reports rarely, or a device that went offline months ago)
const trimToRetention = async (key: string): Promise<void> => {
  const client = await getClient();
  const expiredCount = await client.zCount(key, '-inf', Date.now() - (settings.measurementRetentionDays * msPerDay));
  if (expiredCount > 1) {
    await client.zRemRangeByRank(key, 0, expiredCount - 2);
  }
};

/** store points for one series and trim it to the retention window */
const addPoints = async (locationId: string, measurement: IMeasurementType, deviceId: string, componentId: string, points: IMeasurementHistoryPoint[]): Promise<void> => {
  if (!points.length) {
    return;
  }
  const key = seriesKey(locationId, measurement, deviceId, componentId);
  await (await getClient()).zAdd(key, points.map(p => ({score: p.epoch, value: `${p.epoch}:${p.value}`})));
  await trimToRetention(key);
};

/** points for one series recorded at or after `since`, oldest first */
const getPoints = async (locationId: string, measurement: IMeasurementType, deviceId: string, componentId: string, since: number): Promise<IMeasurementHistoryPoint[]> => {
  const members = await (await getClient()).zRangeByScore(seriesKey(locationId, measurement, deviceId, componentId), since, '+inf');
  return members.map(parsePoint).filter((p): p is IMeasurementHistoryPoint => !!p);
};

/** the most recent point recorded strictly before `before`, or null if there isn't one */
const getLastPointBefore = async (locationId: string, measurement: IMeasurementType, deviceId: string, componentId: string, before: number): Promise<IMeasurementHistoryPoint | null> => {
  const member = await getLastMemberBefore(seriesKey(locationId, measurement, deviceId, componentId), before);
  return member ? parsePoint(member) : null;
};

/**
 * Record a device's current health state, only if it differs from the last recorded one. `changedAt` is when
 * SmartThings says the state last changed - kept after the previous change so the history always stays in order.
 */
const recordHealth = async (locationId: string, deviceId: string, state: string, changedAt: number): Promise<void> => {
  const client = await getClient();
  const key = healthKey(locationId, deviceId);
  const [lastMember] = await client.zRange(key, 0, 0, {REV: true});
  const last = lastMember ? parseHealth(lastMember) : null;
  if (last?.state === state) {
    return;
  }
  const epoch = last ? Math.max(changedAt, last.epoch + 1) : changedAt;
  await client.zAdd(key, {score: epoch, value: `${epoch}:${state}`});
  await trimToRetention(key);
};

/** the health state in effect at `since` plus every change after it */
const getHealthHistory = async (locationId: string, deviceId: string, since: number): Promise<IHealthHistory> => {
  const key = healthKey(locationId, deviceId);
  const before = await getLastMemberBefore(key, since);
  const members = await (await getClient()).zRangeByScore(key, since, '+inf');
  return {
    stateAtSince: before ? parseHealth(before)?.state ?? null : null,
    changes: members.map(parseHealth).filter((c): c is IHealthChange => !!c)
  };
};

const isBackfilled = async (locationId: string): Promise<boolean> => !!(await (await getClient()).get(`${backfilledPrefix}${locationId}`));

const markBackfilled = async (locationId: string): Promise<void> => {
  await (await getClient()).set(`${backfilledPrefix}${locationId}`, new Date().toISOString());
};

export default {
  addPoints,
  getPoints,
  getLastPointBefore,
  recordHealth,
  getHealthHistory,
  isBackfilled,
  markBackfilled
};
