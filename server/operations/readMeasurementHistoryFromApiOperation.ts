import type {Nullable} from 'types';
import type {IMeasurementHistoryPoint, IMeasurementType} from 'types/sharedContracts';
import measurementSettings, {measurementDefinitions, measurementTypes} from '../constants/measurements';
import getSmartThingsClient from '../provider/smartThingsClient';
import listMeasurementDevicesFromApiOperation from './listMeasurementDevicesFromApiOperation';

export interface IMeasurementHistorySeriesPoints {
  measurement: IMeasurementType;
  deviceId: string;
  componentId: string;
  points: IMeasurementHistoryPoint[]; // newest first, as the history API returns them
}

export interface IMeasurementHistoryFromApi {
  truncated: boolean; // true when maxPages ran out before reaching `since`
  series: IMeasurementHistorySeriesPoints[];
}

// history values are typed loosely by the SDK - accept numbers, or numeric strings just in case
const toNumber = (value: unknown): Nullable<number> => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const eventKey = (deviceId: string, componentId: string, capability: string, attribute: string): string => `${deviceId}/${componentId}/${capability}/${attribute}`;

/**
 * Reads every measurement type's events since `since` from the SmartThings history API, in a single walk over the
 * history of all measurement devices in the location (the API can't filter by capability, so one walk serves all
 * measurements). Stops after `maxPages` pages - see constants/measurements.ts for why this needs to stay small.
 */
const readMeasurementHistoryFromApiOperation = async (locationId: string, since: number, maxPages: number): Promise<IMeasurementHistoryFromApi> => {
  const series = new Map<string, IMeasurementHistorySeriesPoints>();
  for (const measurement of measurementTypes) {
    const {capability, attribute} = measurementDefinitions[measurement];
    for (const {device, component} of await listMeasurementDevicesFromApiOperation(locationId, measurement)) {
      series.set(eventKey(device.deviceId, component.id, capability, attribute), {measurement: measurement, deviceId: device.deviceId, componentId: component.id, points: []});
    }
  }

  const result: IMeasurementHistoryFromApi = {truncated: false, series: [...series.values()]};
  if (!series.size) {
    return result;
  }

  // history comes back newest first, so walk pages until we pass `since`
  const page = await getSmartThingsClient().history.devices({
    locationId: locationId,
    deviceId: [...new Set(result.series.map(s => s.deviceId))],
    limit: measurementSettings.backfill.pageSize
  });

  let pagesRead = 1;
  let reachedSince = false;
  for (;;) {
    for (const event of page.items) {
      if (event.epoch < since) {
        reachedSince = true;
        break;
      }
      const target = series.get(eventKey(event.deviceId, event.component, event.capability, event.attribute));
      const value = toNumber(event.value);
      if (target && value !== null) {
        target.points.push({epoch: event.epoch, value: value});
      }
    }

    if (reachedSince || !page.hasNext()) {
      break;
    }
    if (pagesRead >= maxPages) {
      result.truncated = true;
      break;
    }
    await page.next();
    pagesRead++;
  }

  return result;
};

export default readMeasurementHistoryFromApiOperation;
