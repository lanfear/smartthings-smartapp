import useSWR, {unstable_serialize as swrKeySerializer} from 'swr';
import getWeather from '../operations/getWeather';
import type {IResponseWeather, Nullable} from '../types/sharedContracts';
import {useLocationContextStore} from './LocationContextStore';

export interface IWeatherStore {
  // undefined until the first load finishes (or there's a cached response from an earlier visit)
  weatherData: IResponseWeather | undefined;
  isLoading: boolean;
}

// the vendor updates every 10-20 minutes and the server records it every MEASUREMENT_POLL_MINUTES (default 5)
const weatherRefreshIntervalMs = 300_000;

// App's SWRConfig caches every successful response in localStorage, so show the last known weather immediately on load
const getFallbackData = (locationId: string, hours: number): Nullable<IResponseWeather> => {
  const localStorageData = localStorage.getItem(swrKeySerializer(['weather', locationId, hours]));
  return localStorageData ? JSON.parse(localStorageData) as IResponseWeather : null;
};

// outdoor weather and recorded outdoor temperature for the active location
export const useWeatherStore = (hours: number): IWeatherStore => {
  const locationId = useLocationContextStore(s => s.locationId);
  const fallbackData = locationId ? getFallbackData(locationId, hours) : null;

  const {data, isLoading} = useSWR(
    locationId ? ['weather', locationId, hours] : null,
    // swr 2 passes the whole key array as a single argument
    ([, l, h]: [string, string, number]) => getWeather(l, h),
    {
      revalidateOnMount: true,
      dedupingInterval: 30_000,
      refreshInterval: weatherRefreshIntervalMs,
      ...(fallbackData ? {fallbackData} : {})
    }
  );

  return {
    weatherData: data,
    isLoading: isLoading
  };
};
