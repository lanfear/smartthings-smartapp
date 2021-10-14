import {DeviceContext} from '@smartthings/smartapp';

const create = (devices: DeviceContext[]): DeviceContext[] => devices.filter((s, i, self) => s && self.findIndex(c => c?.deviceId === s.deviceId) === i);

export default create;