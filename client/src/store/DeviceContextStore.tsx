// src/theme-context.js
import React, {createContext, useContext, useCallback} from 'react';
import {Device, Room as IRoom, SceneSummary} from '@smartthings/core-sdk';
import useSWR, {KeyedMutator, unstable_serialize as swrKeySerializer} from 'swr';
import getLocation from '../operations/getLocation';
import {IResponseLocation} from '../types/sharedContracts';

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
  locationData.rooms = locationData.rooms?.sort(sortRoom).filter(r => !filteredRooms.includes(r.name as string)) ?? [];
  locationData.scenes = locationData.scenes?.sort(sortScene) ?? [];
  locationData.switches = locationData.switches?.sort(sortLabel) ?? [];
  locationData.locks = locationData.locks?.sort(sortLabel) ?? [];
  locationData.motion = locationData.motion?.sort(sortLabel) ?? [];
  return locationData;
};

const getFallbackData = (locationId: string): IResponseLocation => {
  const localStorageData = localStorage.getItem(swrKeySerializer(['locationData', locationId]));
  return localStorageData ? JSON.parse(localStorageData) as IResponseLocation : {
    ...initialDeviceData,
    locationId
  };
};

// create context provider
const DeviceContext = createContext({deviceData: initialDeviceData} as IDeviceContextStore);

export const DeviceContextStore: React.FC<IDeviceContextStoreProps> = ({locationId, children}) => {
  const {data: deviceData, mutate: setDeviceData} = useSWR(['locationData', locationId], (_, l) => getDeviceDataFromServer(l), {
    revalidateOnMount: true,
    dedupingInterval: 5000,
    fallbackData: getFallbackData(locationId)
  });

  const loadDeviceDataFromServer = useCallback(async (): Promise<void> => {
    const data = await getDeviceDataFromServer(locationId);
    await setDeviceData(data, {revalidate: false});
  }, [locationId, setDeviceData]);

  return (
    <DeviceContext.Provider value={{
      deviceData: deviceData || initialDeviceData,
      setDeviceData: setDeviceData,
      loadDeviceDataFromServer: loadDeviceDataFromServer
    }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

// export ability to use the context
export const useDeviceContext = (): IDeviceContextStore => useContext(DeviceContext);

export interface IDeviceContextStore {
  deviceData: IResponseLocation;
  setDeviceData: KeyedMutator<IResponseLocation>;
  loadDeviceDataFromServer: () => Promise<void>;
}

export interface IDeviceContextStoreProps {
  locationId: string;
  children: React.ReactNode;
}
