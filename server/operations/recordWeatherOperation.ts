import {readCelsius, readKmh, readNumber, readString} from '../factories/weatherFactory';
import weatherStore, {type IWeatherField} from '../provider/weatherStore';
import readWeatherFromApiOperation from './readWeatherFromApiOperation';

/**
 * Store the location's current outdoor readings (the weather service has no history of its own). Called on every
 * measurement poll (see recordMeasurementsOperation.ts); readings are stamped with the vendor's update time, so polls
 * between updates don't add duplicate points.
 */
const recordWeatherOperation = async (locationId: string): Promise<void> => {
  const {weather, airQuality} = await readWeatherFromApiOperation(locationId);
  const updatedAt = Date.parse(readString(weather?.lastUpdateTime) ?? '');
  if (!weather || !Number.isFinite(updatedAt)) {
    return;
  }
  const values: Record<IWeatherField, ReturnType<typeof readNumber>> = {
    temperature: readCelsius(weather.temperature),
    feelsLike: readCelsius(weather.temperatureFeelsLike),
    humidity: readNumber(weather.relativeHumidity),
    windSpeed: readKmh(weather.windSpeed),
    uvIndex: readNumber(weather.uvIndex),
    airQualityIndex: readNumber(airQuality?.airQualityIndex)
  };
  await weatherStore.addReadings(locationId, updatedAt, Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)));
};

export default recordWeatherOperation;
