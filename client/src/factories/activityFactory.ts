import type {IActivityPeriod, IResponseActivity} from '../types/sharedContracts';

export interface IActivityRange {
  id: string;
  hours: number;
  gridHours: number; // a vertical grid line (and axis tick) every this many hours, on local clock boundaries
}

export const activityRanges: IActivityRange[] = [
  {id: '6h', hours: 6, gridHours: 1},
  {id: '24h', hours: 24, gridHours: 3},
  {id: '7d', hours: 168, gridHours: 24}
];

// lights on with no motion in the room for at least this long count as idle (left on)
const idleShortMinutes = 10;
const idleDefaultMinutes = 30;
const idleLongMinutes = 60;
export const idleMinuteOptions = [idleShortMinutes, idleDefaultMinutes, idleLongMinutes];
export const defaultIdleMinutes = idleDefaultMinutes;

// motion/lights take series colors from the climate palette (violet, amber); idle reuses the critical status red and is
// always hatched + labelled, never color alone
export const activityColor = {
  motion: '#6250d6',
  light: '#eda100',
  idle: '#d03b3b',
  lane: '#f1f0ea',
  grid: '#e1e0d9',
  unrecorded: '#c3c2b7'
} as const;

const msPerMinute = 60 * 1000;
export const msPerHour = 60 * msPerMinute;

/** merge overlapping/touching periods into one sorted list */
export const unionPeriods = (periods: IActivityPeriod[]): IActivityPeriod[] => {
  const merged: IActivityPeriod[] = [];
  for (const [start, end] of [...periods].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1] as IActivityPeriod | undefined;
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
};

/** the parts of `base` not covered by any of `cut` (both sorted, non-overlapping) */
export const subtractPeriods = (base: IActivityPeriod[], cut: IActivityPeriod[]): IActivityPeriod[] => base.flatMap(([start, end]) => {
  let pieces: IActivityPeriod[] = [[start, end]];
  for (const [cutStart, cutEnd] of cut) {
    pieces = pieces.flatMap(([a, b]): IActivityPeriod[] => (cutEnd <= a || cutStart >= b
      ? [[a, b]]
      : [...(cutStart > a ? [[a, cutStart] as IActivityPeriod] : []), ...(cutEnd < b ? [[cutEnd, b] as IActivityPeriod] : [])]));
  }
  return pieces;
});

export const totalDuration = (periods: IActivityPeriod[]): number => periods.reduce((sum, [start, end]) => sum + (end - start), 0);

/** display only: also merge periods separated by less than `minGapMs` (gaps too small to see), keeping the DOM small on long ranges */
export const bridgeGaps = (periods: IActivityPeriod[], minGapMs: number): IActivityPeriod[] => unionPeriods(periods.map(([start, end]) => [start, end + minGapMs]))
  .map(([start, end]) => [start, end - minGapMs]);

export const formatDuration = (ms: number): string => {
  const minutes = Math.round(ms / msPerMinute);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};

export interface IRoomFloor {
  floorLevel: number; // 0 = basement, 1 = 1st floor... -1 = no floor in the name
  shortName: string; // room name without its floor prefix
}

// rooms are named '<floor> - <room>' (B, 1F, 2F...)
export const parseRoomFloor = (name: string): IRoomFloor => {
  const match = /^\s*(B|(\d+)F)\s*-\s*(.+)$/i.exec(name);
  if (!match) {
    return {floorLevel: -1, shortName: name};
  }
  return {floorLevel: match[1].toUpperCase() === 'B' ? 0 : Number(match[2]), shortName: match[3]};
};

export interface IActivityRoom extends IRoomFloor {
  roomId: string;
  motion: IActivityPeriod[];
  light: IActivityPeriod[];
  idle: IActivityPeriod[]; // lights on with no motion for idleMs or longer
  motionCount: number;
  lightCount: number;
}

/**
 * One row per room that has a motion sensor: motion and lights each merged across every device in the room, plus the
 * idle stretches. Stacked like the building - top floor first, basement last, rooms without a floor prefix after that -
 * and alphabetical within a floor so rooms stay where you expect them.
 */
export const buildActivityRooms = (activity: IResponseActivity, roomNames: Map<string | undefined, string | undefined>, idleMs: number): IActivityRoom[] => {
  const roomIds = [...new Set(activity.devices.filter(d => d.kind === 'motion' && d.roomId).map(d => d.roomId!))];
  return roomIds.flatMap(roomId => {
    const name = roomNames.get(roomId);
    if (!name) {
      return []; // a room the dashboard hides
    }
    const devices = activity.devices.filter(d => d.roomId === roomId);
    const motionDevices = devices.filter(d => d.kind === 'motion');
    const lightDevices = devices.filter(d => d.kind === 'light');
    const motion = unionPeriods(motionDevices.flatMap(d => d.periods));
    const light = unionPeriods(lightDevices.flatMap(d => d.periods));
    return [{
      roomId: roomId,
      ...parseRoomFloor(name),
      motion: motion,
      light: light,
      idle: subtractPeriods(light, unionPeriods(motion.map(([start, end]) => [start, end + idleMs]))),
      motionCount: motionDevices.length,
      lightCount: lightDevices.length
    }];
  }).sort((a, b) => b.floorLevel - a.floorLevel || a.shortName.localeCompare(b.shortName));
};

const hoursPerDay = 24;

/** grid line times from `since` to `until`, on local clock boundaries (every gridHours from midnight) */
export const getGridTimes = (since: number, until: number, gridHours: number): number[] => {
  const cursor = new Date(since);
  cursor.setMinutes(0, 0, 0);
  // round up to the next boundary: an hour of the day that's a multiple of gridHours (midnight for daily lines)
  const step = Math.min(gridHours, hoursPerDay);
  while (cursor.getTime() < since || cursor.getHours() % step !== 0) {
    cursor.setHours(cursor.getHours() + 1);
  }
  const times: number[] = [];
  while (cursor.getTime() <= until) {
    times.push(cursor.getTime());
    // setHours rolls over days and follows DST, so lines stay on local clock times
    cursor.setHours(cursor.getHours() + gridHours);
  }
  return times;
};
