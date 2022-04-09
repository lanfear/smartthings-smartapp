// types in this file should be copied to corresponding file in server directory as these
// contracts are shared from server to client
import {DeviceContext} from '@smartthings/smartapp';
import {Device, InstalledApp, IntervalUnit, Room, Rule, SceneSummary} from '@smartthings/core-sdk';

export type ResponseRooms = Room[];
export type ResponseScenes = SceneSummary[];
export type ResponseSwitches = (Device & {value: string})[];
export type ResponseLocks = (Device & {value: string})[];
export type ResponseMotion = (Device & {value: string})[];
export type ResponseApps = (InstalledApp & {ruleSummary: IRuleSummary})[];
export type ResponseRules = (Rule & {ruleSummary: IRuleSummary})[];
export interface ResponseLocation {
  rooms: ResponseRooms;
  scenes: ResponseScenes;
  switches: ResponseSwitches;
  locks: ResponseLocks;
  motion: ResponseMotion;
  rules: ResponseRules;
  apps: ResponseApps;
}


export type ISseEventType = 'switch' | 'lock' | 'motion' | 'rule';
export interface ISseEvent
{
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
  enableAllRules: boolean;
  enableDaylightRule: boolean;
  enableNightlightRule: boolean;
  enableIdleRule: boolean;
  enableTransitionRule: boolean;
  installedAppId: string;
  ruleIds: string[];
}