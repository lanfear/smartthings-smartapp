// types in this file should be copied to corresponding file in server directory as these
// contracts are shared from server to client
import type {Device, InstalledApp, IntervalUnit, Room, Rule, SceneSummary} from '@smartthings/core-sdk';
import type {DeviceContext} from '@smartthings/smartapp';
import type {Nullable} from 'types';

export type IRoom = Room;
// roomIds is not part of the SmartThings scenes API (it has no concept of rooms) - we maintain our own
// scene-to-room association (see server/provider/sceneRoomStore.ts) and merge it in here
export type IScene = (SceneSummary & {roomIds: string[]});
export type IDevice = (Device & {value: string});
export type IApp = (InstalledApp & {ruleSummary: IRuleSummary});
export type IRule = (Rule & {
  executionLocation?: string;
  ownerType?: string;
  ownerId?: string;
  creator?: string;
  dateCreated?: Date;
  dateUpdated?: Date;
  ruleSummary: IRuleSummary;
});

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
