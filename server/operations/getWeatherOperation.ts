import type {IMeasurementHistoryPoint, IResponseWeather, IWeatherConditions, Nullable} from 'types/sharedContracts';
import {celsiusToScale, kmhToScale, mmToScale, readCelsius, readKmh, readMm, readNumber, readString} from '../factories/weatherFactory';
import weatherStore from '../provider/weatherStore';
import {clampHistoryHours} from './listMeasurementHistoryOperation';
import readWeatherFromApiOperation, {type IServiceAttributes} from './readWeatherFromApiOperation';

const msPerHour = 60 * 60 * 1000;
const forecastHours = 12;

const readTime = (v: IServiceAttributes[string]): Nullable<string> => {
  const text = readString(v);
  return text && Number.isFinite(Date.parse(text)) ? text : null;
};

const toConditions = (weather: IServiceAttributes, airQuality: Nullable<IServiceAttributes>, scale: 'F' | 'C', updatedAt: number): IWeatherConditions => ({
  phrase: readString(weather.wxPhraseLong) ?? readString(weather.cloudCoverPhrase),
  temperature: celsiusToScale(readCelsius(weather.temperature), scale),
  feelsLike: celsiusToScale(readCelsius(weather.temperatureFeelsLike), scale),
  low: celsiusToScale(readCelsius(weather.dailyOr24hMinTemperature), scale),
  high: celsiusToScale(readCelsius(weather.dailyOr24hMaxTemperature), scale),
  humidity: readNumber(weather.relativeHumidity),
  windSpeed: kmhToScale(readKmh(weather.windSpeed), scale),
  windGust: kmhToScale(readKmh(weather.windGust), scale),
  windDirection: readString(weather.windDirectionCardinal),
  uvIndex: readNumber(weather.uvIndex),
  uvDescription: readString(weather.uvDescription),
  airQualityIndex: readNumber(airQuality?.airQualityIndex),
  sunrise: readTime(weather.sunriseTimeLocal),
  sunset: readTime(weather.sunsetTimeLocal),
  updatedAt: updatedAt
});

// hour N of the forecast is the hour starting N hours after the hour the forecast was issued in
const toForecast = (forecast: IServiceAttributes, scale: 'F' | 'C', updatedAt: number): IMeasurementHistoryPoint[] => {
  const issuedHour = Math.floor(updatedAt / msPerHour) * msPerHour;
  return Array.from({length: forecastHours}, (_, i) => i + 1).flatMap(hour => {
    const value = celsiusToScale(readCelsius(forecast[`temperatureAmount${hour}Hour`] ?? forecast[`temperature${hour}Hour`]), scale);
    return value === null ? [] : [{epoch: issuedHour + (hour * msPerHour), value: value}];
  });
};

/**
 * Current outdoor conditions, the next hours' forecast and the recorded outdoor temperature for the last `hours` hours
 * (default 24, max MEASUREMENT_RETENTION_DAYS), all in the location's temperature scale.
 */
const getWeatherOperation = async (locationId: string, hours?: number): Promise<IResponseWeather> => {
  const until = Date.now();
  const since = until - (clampHistoryHours(hours) * msPerHour);
  const [{temperatureScale: scale, weather, forecast, airQuality}, history, recordingSince] = await Promise.all([
    readWeatherFromApiOperation(locationId),
    weatherStore.getPoints(locationId, 'temperature', since),
    weatherStore.getRecordingSince(locationId)
  ]);
  const updatedAt = Date.parse(readString(weather?.lastUpdateTime) ?? '');
  const issuedAt = Number.isFinite(updatedAt) ? updatedAt : until;

  return {
    locationId: locationId,
    temperatureUnit: scale,
    speedUnit: scale === 'F' ? 'mph' : 'km/h',
    precipUnit: scale === 'F' ? 'in' : 'mm',
    current: weather ? toConditions(weather, airQuality, scale, issuedAt) : null,
    forecast: forecast ? toForecast(forecast, scale, issuedAt) : [],
    precipNext24h: mmToScale(readMm(forecast?.precip24Hour), scale),
    snowNext24h: mmToScale(readMm(forecast?.snow24Hour), scale),
    since: since,
    until: until,
    history: history.flatMap(p => {
      const value = celsiusToScale(p.value, scale);
      return value === null ? [] : [{epoch: p.epoch, value: value}];
    }),
    recordingSince: recordingSince
  };
};

export default getWeatherOperation;
