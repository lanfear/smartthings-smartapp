import type {IMeasurementReading, IMeasurementType} from 'types/sharedContracts';
import listMeasurementDevicesFromApiOperation from './listMeasurementDevicesFromApiOperation';

// current value of the measurement from every device component in the location that reports it
const listMeasurementReadingsFromApiOperation = async (locationId: string, measurement: IMeasurementType): Promise<IMeasurementReading[]> => (await listMeasurementDevicesFromApiOperation(locationId, measurement))
  .map(({device, component, label, componentLabel, state, healthState}) => ({
    deviceId: device.deviceId,
    componentId: component.id,
    label: label,
    ...(componentLabel ? {componentLabel} : {}),
    roomId: device.roomId,
    value: typeof state?.value === 'number' ? state.value : null,
    unit: state?.unit ?? null,
    timestamp: state?.timestamp ?? null,
    healthState: healthState
  }));

export default listMeasurementReadingsFromApiOperation;
