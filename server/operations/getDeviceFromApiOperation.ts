// options?: DeviceListOptions

import {Device} from '@smartthings/core-sdk';
import {Nullable} from 'index';
import getSmartThingsClient from '../provider/smartThingsClient';

const getDeviceFromApiOperation = async (deviceId: string): Promise<Nullable<Device>> => {
  try {
    return await getSmartThingsClient().devices.get(deviceId);
  } catch (e) {
    // not sure what happens when you ask for dev that doesnt exist, so guard for error and return null
    // eslint-disable-next-line no-console
    console.warn('Lookup of device with id [', deviceId, '] failed, returning null', e);
    return null;
  }
};

export default getDeviceFromApiOperation;
