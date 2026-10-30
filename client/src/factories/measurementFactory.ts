import type {IMeasurementHistoryPoint, IMeasurementHistorySeries, IMeasurementReading, IMeasurementType, IResponseMeasurementHistory, Nullable} from '../types/sharedContracts';

// anything with points - a sensor's history series, or a derived line like the group average
export interface IPointSeries {
  points: IMeasurementHistoryPoint[];
}

// categorical series colors in a fixed order, validated for colorblind separation between neighbours and for
// normal-vision distinctness on the page's white surface. aqua/yellow/magenta are under 3:1 contrast on white, which is
// why the comparison chart always ships a legend + table view rather than relying on the line color alone
export const seriesPalette = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'] as const;
export const maxComparedSeries = seriesPalette.length;

// the group average is a reference line, not a category - dark neutral and dashed so it never reads as one of the
// sensor colors above
const averageDashPx = 6;
const averageGapPx = 4;
export const averageLine = {color: '#52514e', dash: [averageDashPx, averageGapPx]} as const;

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

export const measurementTypes: IMeasurementType[] = ['temperature', 'humidity', 'battery', 'heatingSetpoint', 'coolingSetpoint'];

export type IMeasurementGroupId = 'fridge' | 'freezer' | 'rooms' | 'humidity' | 'battery';

// a measurement drawn over a group's sensors as context (e.g. thermostat setpoints over room temps). it must share the
// group's unit. it isn't a sensor, so it's never in the average or the compare picker, and it's always on the chart
export interface IMeasurementReference {
  measurement: IMeasurementType;
  color: string;
}

// dotted to set references apart from the solid sensor lines and the dashed average
const referenceDotPx = 2;
const referenceGapPx = 4;
export const referenceLineDash = [referenceDotPx, referenceGapPx] as const;

// a reference's data for one page render - its current readings (one per device) and history
export interface IMeasurementReferenceData extends IMeasurementReference {
  readings: IMeasurementReading[];
  history: Nullable<IResponseMeasurementHistory>;
}

export interface IMeasurementGroup {
  id: IMeasurementGroupId;
  anchor: string; // the section's element id, so /dashboard/:locationId/climate#<anchor> jumps to it (see the nav menu)
  measurement: IMeasurementType;
  includes: (seriesLabel: string) => boolean;
  references?: IMeasurementReference[];
}

// heat/cool keep their conventional warm/cool hues, darker than the sensor palette's orange and blue so they don't read as sensors
const thermostatReferences: IMeasurementReference[] = [
  {measurement: 'heatingSetpoint', color: '#b4380f'},
  {measurement: 'coolingSetpoint', color: '#1f4fb8'}
];

// sensors are grouped by name - fridge/freezer temps sit far from room temps, so they each get their own chart and scale
const isFreezer = (label: string): boolean => /freezer/i.test(label);
const isFridge = (label: string): boolean => !isFreezer(label) && /fridge|refrigerator|kegerator/i.test(label);

// display order of the climate page's charts
export const measurementGroups: IMeasurementGroup[] = [
  {id: 'fridge', anchor: 'fridges', measurement: 'temperature', includes: isFridge},
  {id: 'freezer', anchor: 'freezers', measurement: 'temperature', includes: isFreezer},
  {id: 'rooms', anchor: 'rooms', measurement: 'temperature', includes: label => !isFridge(label) && !isFreezer(label), references: thermostatReferences},
  {id: 'humidity', anchor: 'humidity', measurement: 'humidity', includes: () => true},
  {id: 'battery', anchor: 'battery', measurement: 'battery', includes: () => true}
];

export const getSeriesKey = (s: {deviceId: string; componentId: string}): string => `${s.deviceId}/${s.componentId}`;

export const getSeriesLabel = (s: {label: string; componentLabel?: string}): string => (s.componentLabel ? `${s.label} (${s.componentLabel})` : s.label);

// devices report 'F'/'C' for temperature and '%' for humidity and battery
export const formatUnit = (unit: Nullable<string>): string => (unit === 'F' || unit === 'C' ? `°${unit}` : unit ?? '');

// unit is optional so a range can show '66.2 – 71.5°F' with the unit only on the end
export const formatValue = (value: Nullable<number>, measurement: IMeasurementType, unit: Nullable<string> = null): string => {
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

export const formatRelativeTime = (timestamp: Nullable<string | number>, now = Date.now()): string => {
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
  min: Nullable<number>;
  max: Nullable<number>;
  avg: Nullable<number>;
}

export const getValueStats = (values: Nullable<number>[]): ISeriesStats => {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) {
    return {min: null, max: null, avg: null};
  }
  return {
    min: Math.min(...present),
    max: Math.max(...present),
    avg: present.reduce((a, v) => a + v, 0) / present.length
  };
};

// stats from a sensor's real readings in the window (not the held/display values)
export const getSeriesStats = (series: IPointSeries | undefined): ISeriesStats => getValueStats(series?.points.map(p => p.value) ?? []);

// default chart selection: this many highest + this many lowest current readings, then this many random others
const defaultOutlierCount = 2;
const defaultRandomCount = 2;

/**
 * Series keys to chart by default: the highest and lowest current readings (the outliers worth seeing first, especially
 * when a group has more sensors than fit), plus a couple of random others. Sensors that are offline or have no reading
 * are left out - an offline sensor can hold a months-old value that would look like an outlier.
 */
export const pickDefaultComparedKeys = (readings: IMeasurementReading[], random: () => number = Math.random): string[] => {
  const candidates = readings
    .filter(r => r.value !== null && r.healthState !== 'OFFLINE')
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const picked = new Set([...candidates.slice(0, defaultOutlierCount), ...candidates.slice(-defaultOutlierCount)]);
  const others = candidates.filter(r => !picked.has(r));
  for (let i = 0; i < defaultRandomCount && others.length; i++) {
    picked.add(others.splice(Math.floor(random() * others.length), 1)[0]);
  }
  return [...picked].slice(0, maxComparedSeries).map(getSeriesKey);
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

const averagePrecision = 10; // round to 0.1

export interface IDisplayGrid {
  xs: number[]; // epoch ms, shared by every column
  columns: Map<string, Nullable<number>[]>; // series key -> value at each x (null = offline / no reading yet)
  average: Nullable<number>[]; // mean of every column at each x
  averageCount: number; // how many series contributed to the average at any point
  references: Map<string, Nullable<number>[]>; // reference key -> value at each x, on the same axis but left out of the average
}

interface IKeyedSeries {
  key: string;
  series: IMeasurementHistorySeries;
}

const isOfflineAt = (series: IMeasurementHistorySeries, x: number): boolean => series.offline.some(o => o.from <= x && (o.to === null || x < o.to));

/**
 * Lines a group's series up on one shared time axis for drawing. Readings are assumed unchanged until the next one
 * ("no change"), but only while the device is online: at each x a series holds its last reading, or null while its
 * device is offline or before its first reading. The lead-in (last reading before the window) seeds the window start.
 * The average is the mean of every series' held value at each x, so it never jumps just because a warm or cold sensor
 * happened to report, and sensors drop out of it while offline. Display only - stats should use the real points.
 * References (e.g. setpoints) are held the same way on the same axis, but never count toward the average.
 */
export const buildDisplayGrid = (seriesList: IKeyedSeries[], since: number, until: number, referenceList: IKeyedSeries[] = []): IDisplayGrid => {
  const xSet = new Set<number>();
  [...seriesList, ...referenceList].forEach(({series}) => {
    series.points.forEach(p => xSet.add(p.epoch));
    if (series.leadIn) {
      xSet.add(since);
    }
    // offline boundaries are x values too, so a line breaks exactly where its device went offline/came back
    series.offline.forEach(o => {
      [o.from, o.to].forEach(x => {
        if (x !== null && x >= since && x <= until) {
          xSet.add(x);
        }
      });
    });
  });
  // hold the latest readings out to now, so lines run to the right edge instead of stopping at their last report
  if (xSet.size && until > Math.max(...xSet)) {
    xSet.add(until);
  }
  const xs = [...xSet].sort((a, b) => a - b);

  const holdOnAxis = ({key, series}: IKeyedSeries): [string, Nullable<number>[]] => {
    let next = 0;
    let last = series.leadIn?.value ?? null;
    return [key, xs.map(x => {
      while (next < series.points.length && series.points[next].epoch <= x) {
        last = series.points[next].value;
        next++;
      }
      return isOfflineAt(series, x) ? null : last;
    })];
  };
  const columns = new Map(seriesList.map(holdOnAxis));

  const columnList = [...columns.values()];
  const average = xs.map((_, i) => {
    const values = columnList.flatMap(c => (c[i] === null ? [] : [c[i]]));
    return values.length ? Math.round((values.reduce((a, v) => a + v, 0) / values.length) * averagePrecision) / averagePrecision : null;
  });
  return {
    xs: xs,
    columns: columns,
    average: average,
    averageCount: columnList.filter(c => c.some(v => v !== null)).length,
    references: new Map(referenceList.map(holdOnAxis))
  };
};
