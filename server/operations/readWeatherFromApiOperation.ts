import {ServiceCapabilitiesEnum} from '@smartthings/core-sdk';
import type {Nullable} from 'types/sharedContracts';
import getSmartThingsClient from '../provider/smartThingsClient';

/* eslint-disable no-console */

// a value as the location service reports it, eg. {value: 19, unit: 'C'} - typed loosely since fields can be missing
export interface IServiceValue {
  value?: unknown;
  unit?: string;
}

// one service capability's attributes by name. read loosely: the SDK's types don't match the live API (it has no
// dailyOr24hMin/MaxTemperature or lastUpdateTime, and names the hourly forecast temperatures
// temperature<N>Hour where the API sends temperatureAmount<N>Hour) and any attribute can be missing
export type IServiceAttributes = Record<string, IServiceValue | undefined>;

export interface IWeatherFromApi {
  temperatureScale: 'F' | 'C';
  weather: Nullable<IServiceAttributes>;
  forecast: Nullable<IServiceAttributes>;
  airQuality: Nullable<IServiceAttributes>;
}

// the vendor updates roughly every 10-20 minutes - the web page and the recorder share one call within this window
const cacheMinutes = 5;
const cacheMs = cacheMinutes * 60 * 1000;
const cache = new Map<string, {fetchedAt: number; data: IWeatherFromApi}>();

/**
 * Current weather, hourly forecast and air quality for the location from the SmartThings location service, plus the
 * location's temperature scale. Missing pieces are null (eg. a location without geo-coordinates has no weather).
 */
const readWeatherFromApiOperation = async (locationId: string): Promise<IWeatherFromApi> => {
  const cached = cache.get(locationId);
  if (cached && Date.now() - cached.fetchedAt < cacheMs) {
    return cached.data;
  }
  const client = getSmartThingsClient();
  const [location, capabilities] = await Promise.all([
    client.locations.get(locationId),
    client.services.getCapabilities([ServiceCapabilitiesEnum.weather, ServiceCapabilitiesEnum.forecast, ServiceCapabilitiesEnum.airQuality], locationId)
      .catch((e: unknown) => {
        console.warn('Reading location weather for [', locationId, '] failed', e);
        return null;
      })
  ]);
  const data: IWeatherFromApi = {
    temperatureScale: location.temperatureScale,
    weather: (capabilities?.weather ?? null) as Nullable<IServiceAttributes>,
    forecast: (capabilities?.forecast ?? null) as Nullable<IServiceAttributes>,
    airQuality: (capabilities?.airQuality ?? null) as Nullable<IServiceAttributes>
  };
  // only cache a full answer, so a failed call is retried on the next request instead of sticking for the window
  if (capabilities) {
    cache.set(locationId, {fetchedAt: Date.now(), data: data});
  }
  return data;
};

export default readWeatherFromApiOperation;
