import type {IMeasurementHistorySeries, IMeasurementType} from '../types/sharedContracts';

// categorical series colors in a fixed order, validated for colorblind separation between neighbours and for
// normal-vision distinctness on the page's white surface. aqua/yellow/magenta are under 3:1 contrast on white, which is
// why the comparison chart always ships a legend + table view rather than relying on the line color alone
export const seriesPalette = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'] as const;
export const maxComparedSeries = seriesPalette.length;

// chart chrome - text never takes a series color, it uses these inks
export const chartInk = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  surface: '#ffffff'
} as const;

// reserved state colors - always paired with an icon + label, never color alone
export const statusColor = {
  good: '#0ca30c',
  critical: '#d03b3b',
  unknown: '#898781'
} as const;

export interface IHistoryRange {
  id: string;
  hours: number;
  // server averages points into buckets this size: keeps every range around 70-180 points per sensor
  bucketMinutes: number;
}

export const historyRanges: IHistoryRange[] = [
  {id: '6h', hours: 6, bucketMinutes: 5},
  {id: '24h', hours: 24, bucketMinutes: 15},
  {id: '7d', hours: 168, bucketMinutes: 60},
  {id: '30d', hours: 720, bucketMinutes: 240}
];

export const measurementTypes: IMeasurementType[] = ['temperature', 'humidity'];

export type IMeasurementGroupId = 'fridge' | 'freezer' | 'rooms' | 'humidity';

export interface IMeasurementGroup {
  id: IMeasurementGroupId;
  measurement: IMeasurementType;
  includes: (seriesLabel: string) => boolean;
}

// sensors are grouped by name - fridge/freezer temps sit far from room temps, so they each get their own chart and scale
const isFreezer = (label: string): boolean => /freezer/i.test(label);
const isFridge = (label: string): boolean => !isFreezer(label) && /fridge|refrigerator|kegerator/i.test(label);

// display order of the climate page's charts
export const measurementGroups: IMeasurementGroup[] = [
  {id: 'fridge', measurement: 'temperature', includes: isFridge},
  {id: 'freezer', measurement: 'temperature', includes: isFreezer},
  {id: 'rooms', measurement: 'temperature', includes: label => !isFridge(label) && !isFreezer(label)},
  {id: 'humidity', measurement: 'humidity', includes: () => true}
];

export const getSeriesKey = (s: {deviceId: string; componentId: string}): string => `${s.deviceId}/${s.componentId}`;

export const getSeriesLabel = (s: {label: string; componentLabel?: string}): string => (s.componentLabel ? `${s.label} (${s.componentLabel})` : s.label);

// devices report 'F'/'C' for temperature and '%' for humidity
export const formatUnit = (unit: string | null): string => (unit === 'F' || unit === 'C' ? `°${unit}` : unit ?? '');

// unit is optional so a range can show '66.2 – 71.5°F' with the unit only on the end
export const formatValue = (value: number | null, measurement: IMeasurementType, unit: string | null = null): string => {
  if (value === null) {
    return '—';
  }
  const digits = measurement === 'temperature' ? 1 : 0;
  return `${value.toFixed(digits)}${formatUnit(unit)}`;
};

const hoursPerDay = 24;
export const msPerMinute = 60 * 1000;
export const msPerHour = 60 * msPerMinute;
const msPerDay = hoursPerDay * msPerHour;

// empty locale list = the viewer's default locale
const relativeTimeFormat = new Intl.RelativeTimeFormat([], {numeric: 'auto'});
const relativeSteps: [Intl.RelativeTimeFormatUnit, number][] = [['day', msPerDay], ['hour', msPerHour], ['minute', msPerMinute]];

export const formatRelativeTime = (timestamp: string | number | null, now = Date.now()): string => {
  if (timestamp === null) {
    return '—';
  }
  const deltaMs = new Date(timestamp).getTime() - now;
  for (const [unit, ms] of relativeSteps) {
    if (Math.abs(deltaMs) >= ms) {
      return relativeTimeFormat.format(Math.round(deltaMs / ms), unit);
    }
  }
  return relativeTimeFormat.format(0, 'minute');
};

const tooltipTimeFormat = new Intl.DateTimeFormat([], {weekday: 'short', hour: 'numeric', minute: '2-digit'});
export const formatTooltipTime = (epochMs: number): string => tooltipTimeFormat.format(epochMs);

export interface ISeriesStats {
  min: number | null;
  max: number | null;
  avg: number | null;
}

export const getSeriesStats = (series: IMeasurementHistorySeries | undefined): ISeriesStats => {
  if (!series?.points.length) {
    return {min: null, max: null, avg: null};
  }
  const values = series.points.map(p => p.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, v) => a + v, 0) / values.length
  };
};

/**
 * Lines series up on one shared x axis for uPlot: [x seconds, ...one y array per series], null where a series has no
 * point. The server buckets every series on the same boundaries, so the union of bucket times is the shared x axis.
 */
export const alignSeries = (seriesList: IMeasurementHistorySeries[]): [number[], ...(number | null)[][]] => {
  const xsMs = [...new Set(seriesList.flatMap(s => s.points.map(p => p.epoch)))].sort((a, b) => a - b);
  const ys = seriesList.map(s => {
    const byEpoch = new Map(s.points.map(p => [p.epoch, p.value]));
    return xsMs.map(x => byEpoch.get(x) ?? null);
  });
  return [xsMs.map(x => x / 1000), ...ys];
};

/**
 * Adds a series to the comparison in the lowest free color slot, or removes it if it's already there. A series keeps
 * its slot for as long as it stays selected, so lines never repaint when others are added or removed. Only keys in
 * `validKeys` count (drops sensors that no longer exist). Returns the slots unchanged when every slot is taken.
 */
export const toggleSeriesSlot = (slots: Record<string, number>, key: string, validKeys: string[]): Record<string, number> => {
  const kept = Object.fromEntries(Object.entries(slots).filter(([k]) => k !== key && validKeys.includes(k)));
  if (key in slots) {
    return kept;
  }
  const used = new Set(Object.values(kept));
  const free = seriesPalette.findIndex((_, i) => !used.has(i));
  return free < 0 ? slots : {...kept, [key]: free};
};
