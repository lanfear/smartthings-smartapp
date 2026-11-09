import type {Nullable} from '../types/sharedContracts';

// the weather service's condition text (eg. 'Partly Cloudy', 'Light Rain Shower') is the reliable signal - its numeric
// icon code doesn't follow the vendor's published table - so the icon is picked from the words, first match wins
const conditionIcons: [RegExp, string, string?][] = [
  // [pattern, day icon, night icon (defaults to the day icon)]
  [/tornado|funnel/i, '🌪️'],
  [/hurricane|tropical/i, '🌀'],
  [/thunder|t-storm|lightning/i, '⛈️'],
  [/snow|flurr|blizzard|sleet|ice|freezing|wintry|hail/i, '🌨️'],
  [/(light|scattered|isolated).*(rain|shower|drizzle)/i, '🌦️', '🌧️'],
  [/rain|shower|drizzle/i, '🌧️'],
  [/fog|mist|haze|smoke|dust|sand/i, '🌫️'],
  [/wind|breez|blustery/i, '🌬️'],
  [/mostly cloudy/i, '🌥️', '☁️'],
  [/partly|mostly sunny|mostly clear|few clouds|scattered clouds/i, '⛅', '☁️'],
  [/cloud|overcast/i, '☁️'],
  [/sunny|clear|fair/i, '☀️', '🌙'],
  [/hot/i, '🌡️']
];
const defaultIcon = '🌡️';

/** night between today's sunset and sunrise (the service sends today's times) - day when either is unknown */
export const isNight = (sunrise: Nullable<string>, sunset: Nullable<string>, now = Date.now()): boolean => {
  const rise = sunrise ? Date.parse(sunrise) : NaN;
  const set = sunset ? Date.parse(sunset) : NaN;
  return Number.isFinite(rise) && Number.isFinite(set) && (now < rise || now >= set);
};

export const getConditionIcon = (phrase: Nullable<string>, night: boolean): string => {
  const match = conditionIcons.find(([pattern]) => !!phrase && pattern.test(phrase));
  return match ? (night ? match[2] ?? match[1] : match[1]) : defaultIcon;
};

export type IAirQualityCategory = 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'veryUnhealthy' | 'hazardous';

// EPA AQI category upper bounds
/* eslint-disable @typescript-eslint/no-magic-numbers */
const airQualityBands: [number, IAirQualityCategory][] = [
  [50, 'good'],
  [100, 'moderate'],
  [150, 'sensitive'],
  [200, 'unhealthy'],
  [300, 'veryUnhealthy']
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

export const getAirQualityCategory = (aqi: number): IAirQualityCategory => airQualityBands.find(([max]) => aqi <= max)?.[1] ?? 'hazardous';

/** whole degrees for the conditions card - outdoor readings don't carry meaningful decimals */
export const formatDegrees = (value: Nullable<number>, unit?: 'F' | 'C'): string => (value === null ? '—' : `${Math.round(value)}°${unit ?? ''}`);

const clockFormat = new Intl.DateTimeFormat([], {hour: 'numeric', minute: '2-digit'});
export const formatClock = (iso: Nullable<string>): string => (iso ? clockFormat.format(Date.parse(iso)) : '—');
