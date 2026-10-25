// request/response contracts shared by server/ and client/ - the single source for both. each side re-exports this
// file from its own types/sharedContracts.d.ts, so imports there keep working. types only: it's never loaded at
// runtime (every import of it is `import type`, erased by tsc/esbuild), so it must not contain values
import type {Device, InstalledApp, IntervalUnit, Room, Rule, SceneSummary} from '@smartthings/core-sdk';

export type Nullable<T> = T | null;

// same shape as DeviceContext in '@smartthings/smartapp' - declared here so the client doesn't depend on that
// server-only package; structurally identical, so the server's SmartApp values satisfy it as-is
export interface DeviceContext {
  deviceId: string;
  name: string;
  label: string;
  componentId: string;
}

export type IRoom = Room;
// roomIds is not part of the SmartThings scenes API (it has no concept of rooms) - we maintain our own
// scene-to-room association (see server/provider/sceneRoomStore.ts) and merge it in here
export type IScene = (SceneSummary & {roomIds: string[]});
export type IDevice = (Device & {value: string});
export type IApp = (InstalledApp & {
  ruleSummary: IRuleSummary;
  // rule ids this install's saved rule data says it owns that no longer exist in SmartThings
  missingRuleIds: string[];
});
export type IRule = (Rule & {
  executionLocation?: string;
  ownerType?: string;
  ownerId?: string;
  creator?: string;
  dateCreated?: Date;
  dateUpdated?: Date;
  ruleSummary?: IRuleSummary; // undefined for rules not created by one of our rule SmartApp installs
  health: IRuleHealth;
});

/**
 * How a rule relates to the rule SmartApp installs, judged from its name (`app-<installedAppId>-rule` /
 * `-transition-rule`) and the rule ids each install saved as its current rules:
 * - ok: named for an install that still exists, and is one of the rules it saved as current
 * - staleDuplicate: named for an existing install, but not one of its current rules - a leftover copy (e.g. from two
 *   overlapping rule updates), safe to delete
 * - orphaned: named for an install that no longer exists (uninstalled while the server couldn't clean up)
 * - untracked: named for an existing install that has no saved rule data, so it can't be checked
 * - external: doesn't follow our naming - created some other way (the rule templates, another app...)
 */
export type IRuleHealthStatus = 'ok' | 'staleDuplicate' | 'orphaned' | 'untracked' | 'external';
export interface IRuleHealth {
  status: IRuleHealthStatus;
  installedAppId: Nullable<string>; // from the rule name - null for external rules
  installedAppName: Nullable<string>; // display name of that install, when it still exists
  currentRuleIds: string[]; // the install's current rule ids (for staleDuplicate: the copies that are kept)
}

export type IRuleComponentType = 'daylight' | 'nightlight' | 'transition' | 'idle';

export type IResponseRooms = IRoom[];
export type IResponseScenes = IScene[];
export type IResponseSwitches = IDevice[];
export type IResponseLocks = IDevice[];
export type IResponseMotion = IDevice[];
export type IResponseApps = IApp[];
export type IResponseRules = IRule[];
export interface IResponseLocation {
  locationId: string;
  rooms: IResponseRooms;
  scenes: IResponseScenes;
  switches: IResponseSwitches;
  locks: IResponseLocks;
  motion: IResponseMotion;
  rules: IResponseRules;
  apps: IResponseApps;
}

export type IMeasurementType = 'temperature' | 'humidity';

// one reading per device *component* that reports the measurement (multi-sensors may report on a non-main component)
export interface IMeasurementReading {
  deviceId: string;
  componentId: string;
  label: string;
  componentLabel?: string; // only set for non-main components
  roomId?: string;
  value: Nullable<number>; // null when the device hasn't reported or its status couldn't be read
  unit: Nullable<string>; // 'F' | 'C' for temperature, '%' for humidity, as reported by the device
  timestamp: Nullable<string>; // ISO-8601 time of the last reported value
  healthState: Nullable<string>; // 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
}
export interface IResponseMeasurements {
  locationId: string;
  measurement: IMeasurementType;
  readings: IMeasurementReading[];
}

export interface IMeasurementHistoryPoint {
  epoch: number; // unix epoch milliseconds
  value: number;
}
// a stretch when the sensor's device was offline (recorded from its SmartThings health state)
export interface IMeasurementOfflineInterval {
  from: number; // epoch ms, clamped to the window start
  to: Nullable<number>; // epoch ms it came back online, null if still offline
}
// one series per device component, points sorted oldest first - recorded by the server (see server/operations/recordMeasurementsOperation.ts),
// so a series only goes back as far as recording (plus the one-time startup backfill) does
export interface IMeasurementHistorySeries {
  deviceId: string;
  componentId: string;
  label: string;
  componentLabel?: string;
  roomId?: string;
  unit: Nullable<string>;
  points: IMeasurementHistoryPoint[]; // only real readings inside the window (bucket averages when bucketed)
  // the last real reading before `since` (at its true time, never bucketed) - lets the client start a line/average at
  // the window edge by carrying it forward. kept separate from points so points never contain made-up values, and a
  // long gap between readings stays visible
  leadIn: Nullable<IMeasurementHistoryPoint>; // null when the device was offline at `since`
  // offline stretches within the window - a reading only carries forward ("no change") while the device is online
  offline: IMeasurementOfflineInterval[];
}
export interface IResponseMeasurementHistory {
  locationId: string;
  measurement: IMeasurementType;
  since: number; // epoch ms - start of the requested window
  until: number; // epoch ms - when the history was read
  series: IMeasurementHistorySeries[];
}

export type ISseEventType = 'switch' | 'lock' | 'motion' | 'rule';

export interface ISseEvent {
  deviceId: string;
  value: string;
}

export interface ISseRuleEvent {
  appId: string;
  ruleSummary: IRuleSummary;
}

export interface IRuleSwitchLevelInfo {
  deviceId: string;
  switchLevel: number;
}
export interface IRuleSummary {
  dayControlSwitch: DeviceContext;
  daySwitches: DeviceContext[];
  dayDimmableSwitches: DeviceContext[];
  dayNonDimmableSwitches: DeviceContext[];
  dayDimmableSwitchLevels: IRuleSwitchLevelInfo[];
  nightControlSwitch: DeviceContext;
  nightSwitches: DeviceContext[];
  nightDimmableSwitches: DeviceContext[];
  nightNonDimmableSwitches: DeviceContext[];
  nightDimmableSwitchLevels: IRuleSwitchLevelInfo[];
  motionSensors: DeviceContext[];
  motionIdleTimeout: number;
  motionIdleTimeoutUnit: IntervalUnit;
  motionDurationDelay: number;
  dayStartTime: string;
  dayNightTime: string;
  nightEndTime: string;
  motionMultipleAll: boolean;
  enableAllRules: boolean;
  enableDaylightRule: boolean;
  enableNightlightRule: boolean;
  enableIdleRule: boolean;
  enableTransitionRule: boolean;
  tempDisableAllRules: boolean;
  tempDisableDaylightRule: boolean;
  tempDisableNightlightRule: boolean;
  tempDisableIdleRule: boolean;
  tempDisableTransitionRule: boolean;
  installedAppId: string;
  ruleIds: string[];
}
