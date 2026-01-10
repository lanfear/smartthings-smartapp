// types in this file should be copied to corresponding file in server directory as these
// contracts are shared from server to client
import {DeviceContext} from '@smartthings/smartapp';
import {Device, InstalledApp, IntervalUnit, Room, Rule, SceneSummary} from '@smartthings/core-sdk';

export type IRoom = Room;
export type IScene = SceneSummary;
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
  temporaryDisableDaylightRule: boolean;
  temporaryDisableNightlightRule: boolean;
  temporaryDisableIdleRule: boolean;
  temporaryDisableTransitionRule: boolean;
  installedAppId: string;
  ruleIds: string[];
}
