import type {AttributeState, Component, Device} from '@smartthings/core-sdk';
import type {Nullable} from 'types';
import type {IMeasurementType} from 'types/sharedContracts';
import {measurementDefinitions} from '../constants/measurements';
import listDevicesFromApiOperation from './listDevicesFromApiOperation';

export interface IMeasurementDeviceComponent {
  device: Device;
  component: Component;
  label: string;
  componentLabel?: string;
  state: Nullable<AttributeState>; // current value/unit/timestamp of the measurement attribute
  healthState: Nullable<string>; // 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  healthUpdatedAt: Nullable<string>; // ISO-8601 time the health state last changed
}

// includeHealth adds this to each device, but the SDK's Device type doesn't declare it
type DeviceWithHealth = Device & {healthState?: {state?: string; lastUpdatedDate?: string}};

/**
 * Every device component in the location that reports the measurement, with its current value and device health.
 * Multi-sensors can expose a measurement on a non-main component (e.g. an external probe), so this returns one entry
 * per component rather than per device. A single list call (includeStatus/includeHealth) covers every device, which
 * keeps us well clear of SmartThings API rate limits compared to fetching status per device.
 */
const listMeasurementDevicesFromApiOperation = async (locationId: string, measurement: IMeasurementType): Promise<IMeasurementDeviceComponent[]> => {
  const {capability, attribute} = measurementDefinitions[measurement];
  // the capability filter matches devices exposing it on *any* component, so we still check each component below
  const devices = await listDevicesFromApiOperation({locationId: [locationId], capability: capability, includeStatus: true, includeHealth: true}) as DeviceWithHealth[];
  return devices.flatMap(device => (device.components ?? []).flatMap(component => {
    const capabilityRef = component.capabilities.find(c => c.id === capability);
    if (!capabilityRef) {
      return [];
    }
    return [{
      device: device,
      component: component,
      label: device.label ?? device.name ?? device.deviceId,
      ...(component.id === 'main' ? {} : {componentLabel: component.label ?? component.id}),
      state: capabilityRef.status?.[attribute] ?? null,
      healthState: device.healthState?.state ?? null,
      healthUpdatedAt: device.healthState?.lastUpdatedDate ?? null
    }];
  }));
};

export default listMeasurementDevicesFromApiOperation;
