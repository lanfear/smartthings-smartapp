import type {IMeasurementHistoryPoint, IMeasurementOfflineInterval, IMeasurementType, IResponseMeasurementHistory} from 'types/sharedContracts';
import measurementSettings from '../constants/measurements';
import measurementStore, {type IHealthHistory} from '../provider/measurementStore';
import settings from '../provider/settings';
import listMeasurementDevicesFromApiOperation from './listMeasurementDevicesFromApiOperation';

const msPerMinute = 60 * 1000;
const msPerHour = 60 * msPerMinute;
const hoursPerDay = 24;
const valuePrecision = 10; // round bucket averages to 0.1

export interface IMeasurementHistoryOptions {
  hours?: number;
  deviceIds?: string[];
  bucketMinutes?: number; // average points into fixed time buckets (0/undefined returns raw points)
}

export const clampHistoryHours = (hours?: number): number => (typeof hours === 'number' && Number.isFinite(hours) && hours > 0
  ? Math.min(hours, settings.measurementRetentionDays * hoursPerDay)
  : measurementSettings.history.defaultHours);

// buckets start on whole multiples of bucketMs since the epoch, so every series lands on the same x values -
// that lets the client line series up for a shared crosshair without resampling. points must be oldest first
const bucketPoints = (points: IMeasurementHistoryPoint[], bucketMs: number): IMeasurementHistoryPoint[] => {
  if (bucketMs <= 0) {
    return points;
  }
  const buckets = new Map<number, {sum: number; count: number}>();
  for (const p of points) {
    const bucketStart = Math.floor(p.epoch / bucketMs) * bucketMs;
    const bucket = buckets.get(bucketStart) ?? {sum: 0, count: 0};
    bucket.sum += p.value;
    bucket.count++;
    buckets.set(bucketStart, bucket);
  }
  return [...buckets].map(([epoch, {sum, count}]) => ({epoch: epoch, value: Math.round((sum / count) * valuePrecision) / valuePrecision}));
};

// offline stretches from recorded health changes. before health recording began nothing is known, so the device is
// assumed online - same "no change" assumption as carrying readings forward
const toOfflineIntervals = ({stateAtSince, changes}: IHealthHistory, since: number): IMeasurementOfflineInterval[] => {
  const intervals: IMeasurementOfflineInterval[] = [];
  let offlineFrom = stateAtSince === 'OFFLINE' ? since : null;
  for (const change of changes) {
    if (change.state === 'OFFLINE') {
      offlineFrom ??= change.epoch;
    } else if (offlineFrom !== null) {
      intervals.push({from: offlineFrom, to: change.epoch});
      offlineFrom = null;
    }
  }
  if (offlineFrom !== null) {
    intervals.push({from: offlineFrom, to: null});
  }
  return intervals;
};

/**
 * Recorded history of the measurement for the last `hours` hours, one series per device component in the location.
 * Labels/units come from a single live device list call, points from redis.
 */
const listMeasurementHistoryOperation = async (locationId: string, measurement: IMeasurementType, options: IMeasurementHistoryOptions = {}): Promise<IResponseMeasurementHistory> => {
  const {deviceIds = [], bucketMinutes = 0} = options;
  const bucketMs = Number.isFinite(bucketMinutes) && bucketMinutes > 0 ? bucketMinutes * msPerMinute : 0;
  const until = Date.now();
  const since = until - (clampHistoryHours(options.hours) * msPerHour);

  const deviceComponents = (await listMeasurementDevicesFromApiOperation(locationId, measurement))
    .filter(dc => !deviceIds.length || deviceIds.includes(dc.device.deviceId));

  // health is per device - fetch it once even when several of a device's components are in the list
  const deviceIdList = [...new Set(deviceComponents.map(dc => dc.device.deviceId))];
  const offlineByDevice = new Map(await Promise.all(deviceIdList.map(async id => [
    id,
    toOfflineIntervals(await measurementStore.getHealthHistory(locationId, id, since), since)
  ] as const)));

  const series = await Promise.all(deviceComponents.map(async ({device, component, label, componentLabel, state}) => {
    const offline = offlineByDevice.get(device.deviceId) ?? [];
    const offlineAtSince = offline.some(o => o.from <= since && (o.to === null || o.to > since));
    return {
      deviceId: device.deviceId,
      componentId: component.id,
      label: label,
      ...(componentLabel ? {componentLabel} : {}),
      roomId: device.roomId,
      unit: state?.unit ?? null,
      points: bucketPoints(await measurementStore.getPoints(locationId, measurement, device.deviceId, component.id, since), bucketMs),
      leadIn: offlineAtSince ? null : await measurementStore.getLastPointBefore(locationId, measurement, device.deviceId, component.id, since),
      offline: offline
    };
  }));

  return {locationId, measurement, since, until, series};
};

export default listMeasurementHistoryOperation;
