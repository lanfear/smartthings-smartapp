// src/theme-context.js
import type {Device, Room as IRoom, SceneSummary} from '@smartthings/core-sdk';
import {useCallback} from 'react';
import {useEventSource, useEventSourceListener} from 'react-sse-hooks';
import useSWR, {unstable_serialize as swrKeySerializer, type KeyedMutator} from 'swr';
import getLocation from '../operations/getLocation';
import type {IResponseLocation, ISseRuleEvent} from '../types/sharedContracts';
import {useLocationContextStore} from './LocationContextStore';

export interface IDeviceContextStore {
  deviceData: IResponseLocation;
  setDeviceData: KeyedMutator<IResponseLocation>;
  loadDeviceDataFromServer: () => Promise<void>;
}

const filteredRooms = ['DO NOT USE'];

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

// SWR hook for device data
export const useDeviceStore = (): IDeviceContextStore => {
  const activeLocationId = useLocationContextStore(s => s.locationId);

  const {data: deviceData, mutate: _setDeviceData} = useSWR(
    activeLocationId ? ['locationData', activeLocationId] : null,
    (_, l) => getDeviceDataFromServer(l),
    {
      revalidateOnMount: true,
      dedupingInterval: 5000,
      fallbackData: activeLocationId ? getFallbackData(activeLocationId) : initialDeviceData
    }
  );

  const setDeviceData: typeof _setDeviceData = useCallback(
    async (data, opts) => await _setDeviceData(JSON.parse(JSON.stringify(data)) as IResponseLocation, opts),
    [_setDeviceData]
  );

  // listen to sse events
  const deviceEventSource = useEventSource({
    source: `${process.env.SMARTAPP_BUILDTIME_APIHOST}/events`,
    options: {enabled: !!activeLocationId}
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

  return {
    deviceData: deviceData ?? initialDeviceData,
    setDeviceData: setDeviceData,
    loadDeviceDataFromServer: loadDeviceDataFromServer
  };
};
