// src/theme-context.js
import React, {createContext, useContext} from 'react';
import {IResponseLocation} from '../types/sharedContracts';

// create context
const DeviceContext = createContext({} as IDeviceContextStore);

// create context provider
export const DeviceContextStore: React.FC<IDeviceContextStoreProps> = ({value, children}) => (
  <DeviceContext.Provider value={value}>
    {children}
  </DeviceContext.Provider>
);

// export ability to use the context
export const useDeviceContext = (): IDeviceContextStore => useContext(DeviceContext);

export interface IDeviceContextStore {
  deviceData: IResponseLocation;
  setDeviceData: (value: IResponseLocation) => void;
}

export interface IDeviceContextStoreProps {
  value: IDeviceContextStore;
  children: React.ReactNode;
}