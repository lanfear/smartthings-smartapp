import type {IMeasurementType} from 'types/sharedContracts';

export interface IMeasurementDefinition {
  capability: string;
  attribute: string;
}

// maps each measurement the dashboard can graph to the SmartThings capability/attribute that reports it
export const measurementDefinitions: Record<IMeasurementType, IMeasurementDefinition> = {
  temperature: {capability: 'temperatureMeasurement', attribute: 'temperature'},
  humidity: {capability: 'relativeHumidityMeasurement', attribute: 'humidity'},
  battery: {capability: 'battery', attribute: 'battery'},
  heatingSetpoint: {capability: 'thermostatHeatingSetpoint', attribute: 'heatingSetpoint'},
  coolingSetpoint: {capability: 'thermostatCoolingSetpoint', attribute: 'coolingSetpoint'}
};

export const measurementTypes = Object.keys(measurementDefinitions) as IMeasurementType[];

export const isMeasurementType = (value: string): value is IMeasurementType => (measurementTypes as string[]).includes(value);

export default {
  history: {
    defaultHours: 24
  },
  // one-time seed of recorded history from the SmartThings history API, the first time a location is recorded.
  // that API can't filter by capability (busy multi-sensors flood it with motion/battery/etc events) and rate limits
  // quickly, so only walk a few pages - with ~30 sensors 10 pages covers a couple of hours
  backfill: {
    hours: 24,
    pageSize: 200,
    maxPages: 10
  }
};
