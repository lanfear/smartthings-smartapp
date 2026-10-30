import useSWR from 'swr';
import getActivity from '../operations/getActivity';
import type {IResponseActivity} from '../types/sharedContracts';
import {useLocationContextStore} from './LocationContextStore';

export interface IActivityStore {
  // undefined until the first load finishes
  activityData: IResponseActivity | undefined;
  isLoading: boolean;
  // true while any (re)fetch is in flight, including while an older range is still being shown
  isValidating: boolean;
}

// motion changes every few seconds in a busy house - a minute keeps the timeline current without hammering the server
const activityRefreshIntervalMs = 60_000;

// recorded motion/switch activity for the active location
export const useActivityStore = (hours: number): IActivityStore => {
  const locationId = useLocationContextStore(s => s.locationId);

  const {data, isLoading, isValidating} = useSWR(
    locationId ? ['activity', locationId, hours] : null,
    // swr 2 passes the whole key array as a single argument
    ([, l, h]: [string, string, number]) => getActivity(l, h),
    {
      revalidateOnMount: true,
      dedupingInterval: 10_000,
      refreshInterval: activityRefreshIntervalMs,
      keepPreviousData: true // keep the old timeline on screen while a new range loads
    }
  );

  return {
    activityData: data,
    isLoading: isLoading,
    isValidating: isValidating
  };
};
