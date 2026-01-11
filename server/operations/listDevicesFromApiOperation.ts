//

import {Device, DeviceListOptions} from '@smartthings/core-sdk';
import getSmartThingsClient from '../provider/smartThingsClient';

const listDevicesFromApiOperation = async (options?: DeviceListOptions): Promise<Device[]> => await getSmartThingsClient().devices.list(options);

export default listDevicesFromApiOperation;
