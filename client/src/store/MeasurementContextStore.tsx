import useSWR, {unstable_serialize as swrKeySerializer} from 'swr';
import getMeasurementHistory, {type IMeasurementHistoryOptions} from '../operations/getMeasurementHistory';
import getMeasurements from '../operations/getMeasurements';
import type {IMeasurementType, IResponseMeasurementHistory, IResponseMeasurements} from '../types/sharedContracts';
import {useLocationContextStore} from './LocationContextStore';

export interface IMeasurementStore {
  measurementData: IResponseMeasurements;
  isLoading: boolean;
  // true while a fetch is in flight - on page load the cached (possibly hours old) readings show until this settles
  isValidating: boolean;
  reloadMeasurementData: () => Promise<void>;
}

export interface IMeasurementHistoryStore {
  // undefined until the first load finishes
  historyData: IResponseMeasurementHistory | undefined;
  isLoading: boolean;
  // true while any (re)fetch is in flight, including while an older range/measurement is still being shown
  isValidating: boolean;
  reloadHistoryData: () => Promise<void>;
}

// the control SmartApp doesn't subscribe to temperature/humidity events, so there's no SSE push - poll instead.
// most sensors only report every few minutes (or on a change threshold), so a minute is plenty fresh
const readingsRefreshIntervalMs = 60_000;
// history only gains a point per sensor every MEASUREMENT_POLL_MINUTES (default 5), so refresh it less often
const historyRefreshIntervalMs = 300_000;

const byLabel = <T extends {label: string; componentId: string}>(r: T, l: T): number => {
  const labelOrder = r.label.toUpperCase().localeCompare(l.label.toUpperCase());
  return labelOrder !== 0 ? labelOrder : r.componentId.localeCompare(l.componentId);
};

const getMeasurementDataFromServer = async (locationId: string, measurement: IMeasurementType): Promise<IResponseMeasurements> => {
  const data = await getMeasurements(locationId, measurement);
  data.readings = data.readings.sort(byLabel);
  return data;
};

const getHistoryDataFromServer = async (locationId: string, measurement: IMeasurementType, options: IMeasurementHistoryOptions): Promise<IResponseMeasurementHistory> => {
  const data = await getMeasurementHistory(locationId, measurement, options);
  data.series = data.series.sort(byLabel);
  return data;
};

// App's SWRConfig caches every successful response in localStorage, so show the last known readings immediately on load
const getFallbackData = (locationId: string, measurement: IMeasurementType): IResponseMeasurements => {
  const localStorageData = localStorage.getItem(swrKeySerializer(['measurementData', locationId, measurement]));
  return localStorageData ? JSON.parse(localStorageData) as IResponseMeasurements : {locationId: locationId, measurement: measurement, readings: []};
};

// current readings of one measurement for the active location
export const useMeasurementStore = (measurement: IMeasurementType): IMeasurementStore => {
  const locationId = useLocationContextStore(s => s.locationId);

  const {data, isLoading, isValidating, mutate} = useSWR(
    locationId ? ['measurementData', locationId, measurement] : null,
    // swr 2 passes the whole key array as a single argument
    ([, l, m]: [string, string, IMeasurementType]) => getMeasurementDataFromServer(l, m),
    {
      revalidateOnMount: true,
      dedupingInterval: 5000,
      refreshInterval: readingsRefreshIntervalMs,
      fallbackData: getFallbackData(locationId ?? '', measurement)
    }
  );

  return {
    measurementData: data,
    isLoading: isLoading,
    isValidating: isValidating,
    reloadMeasurementData: async () => {
      await mutate();
    }
  };
};

// history of one measurement for the active location
export const useMeasurementHistoryStore = (measurement: IMeasurementType, options: IMeasurementHistoryOptions): IMeasurementHistoryStore => {
  const locationId = useLocationContextStore(s => s.locationId);
  const {hours, bucketMinutes = 0, deviceIds = []} = options;

  const {data, isLoading, isValidating, mutate} = useSWR(
    // deviceIds sorted + joined so the cache key is stable regardless of selection order / array identity
    locationId ? ['measurementHistory', locationId, measurement, hours, bucketMinutes, [...deviceIds].sort().join(',')] : null,
    ([, l, m, h, b, d]: [string, string, IMeasurementType, number, number, string]) => getHistoryDataFromServer(l, m, {hours: h, bucketMinutes: b, deviceIds: d ? d.split(',') : []}),
    {
      revalidateOnMount: true,
      dedupingInterval: 30_000,
      refreshInterval: historyRefreshIntervalMs,
      keepPreviousData: true // keep the old graph on screen while a new range/measurement loads
    }
  );

  return {
    historyData: data,
    isLoading: isLoading,
    isValidating: isValidating,
    reloadHistoryData: async () => {
      await mutate();
    }
  };
};
