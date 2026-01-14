import {create} from 'zustand';
import type {Nullable} from '../types/interfaces';
import getLocations from '../operations/getLocations';
import {useParams} from 'react-router-dom';
import {useCallback, useEffect} from 'react';
import {useEventSource, useEventSourceListener} from 'react-sse-hooks';
import useSWR, {KeyedMutator, unstable_serialize as swrKeySerializer} from 'swr';
import {RouteParams} from '../App';
import {IResponseLocation, IRoom, ISseRuleEvent} from '../types/sharedContracts';
import {Device, SceneSummary} from '@smartthings/core-sdk';
import getLocation from '../operations/getLocation';

export interface ILocationContextStore {
  locationId: Nullable<string>;
  locationName: Nullable<string>;
  deviceData: IResponseLocation;
}

const initialDeviceData: IResponseLocation = {
  locationId: '',
  rooms: [],
  scenes: [],
  switches: [],
  locks: [],
  motion: [],
  rules: [],
  apps: []
};

const defaultContext: ILocationContextStore = {
  locationId: null,
  locationName: null,
  deviceData: initialDeviceData
};

export interface IDeviceContextStore {
  setDeviceData: KeyedMutator<IResponseLocation>;
  loadDeviceDataFromServer: () => Promise<void>;
}

const filteredRooms = ['DO NOT USE'];

const sortRoom = (r: IRoom, l: IRoom): 1 | -1 | 0 => {
  const rName = r.name?.toUpperCase() ?? ''; // ignore upper and lowercase
  const lName = l.name?.toUpperCase() ?? ''; // ignore upper and lowercase
  return rName < lName ? -1 : rName > lName ? 1 : 0;
};

const sortLabel = (r: Device, l: Device): 1 | -1 | 0 => {
  const rName = r.label?.toUpperCase() ?? ''; // ignore upper and lowercase
  const lName = l.label?.toUpperCase() ?? ''; // ignore upper and lowercase
  return rName < lName ? -1 : rName > lName ? 1 : 0;
};

const sortScene = (r: SceneSummary, l: SceneSummary): 1 | -1 | 0 => {
  const rName = r.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
  const lName = l.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
  return rName < lName ? -1 : rName > lName ? 1 : 0;
};

// create context
const getDeviceDataFromServer = async (locationId: string): Promise<IResponseLocation> => {
  if (!locationId) {
    return initialDeviceData;
  }

  const locationData = await getLocation(locationId);
  locationData.rooms = locationData.rooms.sort(sortRoom).filter(r => !filteredRooms.includes(r.name!));
  locationData.scenes = locationData.scenes.sort(sortScene);
  locationData.switches = locationData.switches.sort(sortLabel);
  locationData.locks = locationData.locks.sort(sortLabel);
  locationData.motion = locationData.motion.sort(sortLabel);
  return locationData;
};

const getFallbackData = (locationId: string): IResponseLocation => {
  const localStorageData = localStorage.getItem(swrKeySerializer(['locationData', locationId]));
  return localStorageData ? JSON.parse(localStorageData) as IResponseLocation : {
    ...initialDeviceData,
    locationId
  };
};

export const useLocationContextStore = create<ILocationContextStore>(() => {
  const {locationId} = useParams<RouteParams>();

  const {data: deviceData, mutate: _setDeviceData} = useSWR(
    locationId ? ['locationData', locationId] : null,
    (_, l) => getDeviceDataFromServer(l),
    {
      revalidateOnMount: true,
      dedupingInterval: 5000,
      fallbackData: locationId ? getFallbackData(locationId) : initialDeviceData
    }
  );

  const setDeviceData: typeof _setDeviceData = useCallback(
    async (data, opts) => await _setDeviceData(JSON.parse(JSON.stringify(data)) as IResponseLocation, opts),
    [_setDeviceData]
  );

  // listen to sse events
  const deviceEventSource = useEventSource({
    source: `${process.env.SMARTAPP_BUILDTIME_APIHOST!}/events`,
    options: {enabled: !!locationId}
  });

  // when any rules event comes in, just reload data from server
  useEventSourceListener<ISseRuleEvent>({
    source: deviceEventSource,
    startOnInit: true,
    event: {
      name: 'rule',
      listener: () => _setDeviceData()
    }
  });

  const loadDeviceDataFromServer = useCallback(async (): Promise<void> => {
    await setDeviceData();
  }, [setDeviceData]);

  useEffect(() => {
    if (locationId && locationId !== (deviceData ?? initialDeviceData).locationId) {
      setLocation(locationId);
    }
  }, [locationId, deviceData]);

  return {
    ...defaultContext,
    setDeviceData,
    loadDeviceDataFromServer
  };
});

export const setLocation = (locationId: string, locationName: Nullable<string> = null): void => {
  if (useLocationContextStore.getState().locationId === locationId) {
    return;
  }
  if (locationName) {
    useLocationContextStore.setState(p => ({...p, locationId, locationName}));
  } else {
    useLocationContextStore.setState(p => ({...p, locationId}));
    void (async () => {
      const locationData = (await getLocations()).find(l => l.locationId === locationId);
      if (locationData) {
        useLocationContextStore.setState(p => ({...p, locationName}));
      }
    })();
  }
};
