import {createClient} from 'redis';
import type {IMeasurementHistoryPoint, Nullable} from 'types/sharedContracts';
import redisErrorListener from './redisErrorListener';
import settings from './settings';

// outdoor readings recorded from the SmartThings location weather service, which only reports the current values.
// stored in the vendor's units (°C, km/h) and converted to the location's scale on read
export type IWeatherField = 'temperature' | 'feelsLike' | 'humidity' | 'windSpeed' | 'uvIndex' | 'airQualityIndex';

// one sorted set per location + field: score = epoch ms, member = `${epoch}:${value}`, same layout as measurementStore.
// the epoch is the vendor's update time, so re-recording an unchanged report (a poll between updates, or dev and live
// both recording into the shared redis) produces the same member and is a no-op
const seriesPrefix = 'st-weather-';
// per location: epoch ms of the first reading ever recorded there - there's no data before it
const recordingSincePrefix = 'st-weather-since-';
const hoursPerDay = 24;
const msPerDay = hoursPerDay * 60 * 60 * 1000;

const redisWeatherStore = createClient({
  url: settings.redisServer
});
redisWeatherStore.on('error', redisErrorListener('weatherStore'));

const getClient = async (): Promise<typeof redisWeatherStore> => {
  if (!redisWeatherStore.isOpen) {
    await redisWeatherStore.connect();
  }
  return redisWeatherStore;
};

const seriesKey = (locationId: string, field: IWeatherField): string => `${seriesPrefix}${locationId}-${field}`;

const parsePoint = (member: string): Nullable<IMeasurementHistoryPoint> => {
  const separator = member.indexOf(':');
  const epoch = Number(member.substring(0, separator));
  const value = Number(member.substring(separator + 1));
  return separator > 0 && Number.isFinite(epoch) && Number.isFinite(value) ? {epoch, value} : null;
};

/** store one reading per field and trim each series to the measurement retention window (MEASUREMENT_RETENTION_DAYS) */
const addReadings = async (locationId: string, epoch: number, values: Partial<Record<IWeatherField, number>>): Promise<void> => {
  const client = await getClient();
  const expiredBefore = Date.now() - (settings.measurementRetentionDays * msPerDay);
  await Promise.all(Object.entries(values).map(async ([field, value]) => {
    const key = seriesKey(locationId, field as IWeatherField);
    await client.zAdd(key, {score: epoch, value: `${epoch}:${value}`});
    await client.zRemRangeByScore(key, '-inf', `(${expiredBefore}`);
  }));
  await client.set(`${recordingSincePrefix}${locationId}`, `${epoch}`, {NX: true});
};

/** points for one field recorded at or after `since`, oldest first */
const getPoints = async (locationId: string, field: IWeatherField, since: number): Promise<IMeasurementHistoryPoint[]> => {
  const members = await (await getClient()).zRangeByScore(seriesKey(locationId, field), since, '+inf');
  return members.map(parsePoint).filter((p): p is IMeasurementHistoryPoint => !!p);
};

const getRecordingSince = async (locationId: string): Promise<Nullable<number>> => {
  const value = await (await getClient()).get(`${recordingSincePrefix}${locationId}`);
  const epoch = value ? Number(value) : NaN;
  return Number.isFinite(epoch) ? epoch : null;
};

export default {
  addReadings,
  getPoints,
  getRecordingSince
};
