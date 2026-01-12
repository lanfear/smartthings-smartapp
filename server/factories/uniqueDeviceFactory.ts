import type {DeviceContext} from '@smartthings/smartapp';

const create = (devices: DeviceContext[]): DeviceContext[] => devices.filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);

export default create;