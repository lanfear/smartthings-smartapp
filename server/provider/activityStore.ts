import {createClient} from 'redis';
import type {Nullable} from 'types/sharedContracts';
import redisErrorListener from './redisErrorListener';
import settings from './settings';

// one sorted set per device of its motion/switch value *changes*: score = epoch ms, member = `${epoch}:${value}`
const eventPrefix = 'st-activity-';
// per location: epoch ms of the first event ever recorded there - there's no data before it
const recordingSincePrefix = 'st-activity-since-';
const hoursPerDay = 24;
const msPerDay = hoursPerDay * 60 * 60 * 1000;

export interface IActivityEvent {
  epoch: number;
  value: string; // 'active' | 'inactive' for motion, 'on' | 'off' for switches
}

const redisActivityStore = createClient({
  url: settings.redisServer
});
redisActivityStore.on('error', redisErrorListener('activityStore'));

const getClient = async (): Promise<typeof redisActivityStore> => {
  if (!redisActivityStore.isOpen) {
    await redisActivityStore.connect();
  }
  return redisActivityStore;
};

const eventKey = (locationId: string, deviceId: string): string => `${eventPrefix}${locationId}-${deviceId}`;

const parseEvent = (member: string): Nullable<IActivityEvent> => {
  const separator = member.indexOf(':');
  const epoch = Number(member.substring(0, separator));
  return separator > 0 && Number.isFinite(epoch) ? {epoch: epoch, value: member.substring(separator + 1)} : null;
};

/**
 * Record a device's motion/switch value, only if it differs from the last recorded one (SmartThings also sends events
 * that repeat the current value). Shares the measurement retention window (MEASUREMENT_RETENTION_DAYS), keeping the
 * newest expired event since it's still the value in effect at the window start.
 */
const recordEvent = async (locationId: string, deviceId: string, epoch: number, value: string): Promise<void> => {
  const client = await getClient();
  const key = eventKey(locationId, deviceId);
  const [lastMember] = await client.zRange(key, 0, 0, {REV: true});
  const last = lastMember ? parseEvent(lastMember) : null;
  if (last?.value === value) {
    return;
  }
  // keep the history in order even if events arrive out of order or within the same millisecond
  const orderedEpoch = last ? Math.max(epoch, last.epoch + 1) : epoch;
  await client.zAdd(key, {score: orderedEpoch, value: `${orderedEpoch}:${value}`});
  await client.set(`${recordingSincePrefix}${locationId}`, `${orderedEpoch}`, {NX: true});

  const expiredCount = await client.zCount(key, '-inf', Date.now() - (settings.measurementRetentionDays * msPerDay));
  if (expiredCount > 1) {
    await client.zRemRangeByRank(key, 0, expiredCount - 2);
  }
};

/** the event in effect at `since` (null if none was recorded before it) plus every event after it, oldest first */
const getEvents = async (locationId: string, deviceId: string, since: number): Promise<{before: Nullable<IActivityEvent>; events: IActivityEvent[]}> => {
  const client = await getClient();
  const key = eventKey(locationId, deviceId);
  // REV + BY SCORE takes (max, min); '(' makes the bound exclusive
  const [beforeMember] = await client.zRange(key, `(${since}`, '-inf', {BY: 'SCORE', REV: true, LIMIT: {offset: 0, count: 1}});
  const members = await client.zRangeByScore(key, since, '+inf');
  return {
    before: beforeMember ? parseEvent(beforeMember) : null,
    events: members.map(parseEvent).filter((e): e is IActivityEvent => !!e)
  };
};

const getRecordingSince = async (locationId: string): Promise<Nullable<number>> => {
  const value = await (await getClient()).get(`${recordingSincePrefix}${locationId}`);
  const epoch = value ? Number(value) : NaN;
  return Number.isFinite(epoch) ? epoch : null;
};

export default {
  recordEvent,
  getEvents,
  getRecordingSince
};
