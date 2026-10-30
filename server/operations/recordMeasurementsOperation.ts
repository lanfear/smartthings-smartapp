import measurementSettings, {measurementTypes} from '../constants/measurements';
import measurementStore from '../provider/measurementStore';
import settings from '../provider/settings';
import getSmartThingsClient from '../provider/smartThingsClient';
import listMeasurementDevicesFromApiOperation from './listMeasurementDevicesFromApiOperation';
import readMeasurementHistoryFromApiOperation from './readMeasurementHistoryFromApiOperation';

/* eslint-disable no-console */

const msPerMinute = 60 * 1000;
const msPerHour = 60 * msPerMinute;

/**
 * Store the latest reported value of every measurement device in the location (one SmartThings call per measurement),
 * plus each device's online/offline state whenever it has changed since the last poll.
 */
export const recordCurrentMeasurements = async (locationId: string): Promise<void> => {
  const healthByDevice = new Map<string, {state: string; changedAt: number}>();
  for (const measurement of measurementTypes) {
    const deviceComponents = await listMeasurementDevicesFromApiOperation(locationId, measurement);
    await Promise.all(deviceComponents.map(async ({device, component, state}) => {
      const epoch = state?.timestamp ? Date.parse(state.timestamp) : NaN;
      if (typeof state?.value === 'number' && Number.isFinite(epoch)) {
        await measurementStore.addPoints(locationId, measurement, device.deviceId, component.id, [{epoch: epoch, value: state.value}]);
      }
    }));
    // a device can report several measurements/components - its health only needs recording once per poll
    deviceComponents.forEach(({device, healthState, healthUpdatedAt}) => {
      if (healthState) {
        const changedAt = healthUpdatedAt ? Date.parse(healthUpdatedAt) : NaN;
        healthByDevice.set(device.deviceId, {state: healthState, changedAt: Number.isFinite(changedAt) ? changedAt : Date.now()});
      }
    });
  }
  await Promise.all([...healthByDevice].map(async ([deviceId, {state, changedAt}]) => {
    await measurementStore.recordHealth(locationId, deviceId, state, changedAt);
  }));
};

/** one-time seed of recorded history from the SmartThings history API (capped, see constants/measurements.ts) */
export const backfillMeasurements = async (locationId: string): Promise<void> => {
  const since = Date.now() - (measurementSettings.backfill.hours * msPerHour);
  const history = await readMeasurementHistoryFromApiOperation(locationId, since, measurementSettings.backfill.maxPages);
  await Promise.all(history.series.map(async s => {
    await measurementStore.addPoints(locationId, s.measurement, s.deviceId, s.componentId, s.points);
  }));
  const oldest = Math.min(...history.series.flatMap(s => s.points.map(p => p.epoch)));
  console.info('Backfilled measurement history for location [', locationId, '] back to [', Number.isFinite(oldest) ? new Date(oldest).toISOString() : 'no events', '] truncated [', history.truncated, ']');
};

let recording = false;

const recordAllLocations = async (): Promise<void> => {
  if (recording) {
    return; // previous run (e.g. a slow backfill) is still going
  }
  recording = true;
  try {
    for (const {locationId} of await getSmartThingsClient().locations.list()) {
      if (!await measurementStore.isBackfilled(locationId)) {
        try {
          await backfillMeasurements(locationId);
          await measurementStore.markBackfilled(locationId);
        } catch (e) {
          // not fatal - recording still works without it, and we'll try the backfill again next run
          console.warn('Measurement history backfill for location [', locationId, '] failed, will retry', e);
        }
      }
      await recordCurrentMeasurements(locationId);
    }
  } catch (e) {
    console.warn('Recording measurements failed, will retry next interval', e);
  } finally {
    recording = false;
  }
};

/** start recording measurement readings (temperature/humidity/battery) for every location every MEASUREMENT_POLL_MINUTES minutes */
export const startMeasurementRecording = (): void => {
  if (settings.measurementPollMinutes <= 0) {
    console.info('Measurement recording disabled (MEASUREMENT_POLL_MINUTES is 0)');
    return;
  }
  console.info('Recording measurements every [', settings.measurementPollMinutes, '] minutes, keeping [', settings.measurementRetentionDays, '] days');
  void recordAllLocations();
  setInterval(() => {
    void recordAllLocations();
  }, settings.measurementPollMinutes * msPerMinute);
};
