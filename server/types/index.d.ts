import {IntervalUnit, RuleRequest} from '@smartthings/core-sdk';
import {DeviceContext} from '@smartthings/smartapp';
import {IRuleSummary} from 'sharedContracts';

export interface ISmartAppRuleMotion {
  valueType: string; // STValueType?
  deviceConfig: {
    deviceId: string;
    componentId: string;
  };
}

export interface ISmartAppRuleSwitch {
  valueType: string; // STValueType?
  deviceConfig: {
    deviceId: string;
    componentId: string;
  };
}

export interface ISmartAppRuleTimeOffset {
  valueType: string; // STValueType?
  stringConfig: {
    value: string;
  };
}

export interface ISmartAppRuleSwitchLevel {
  valueType: string; // STValueType?
  stringConfig: {
    value: string;
  };
}

export interface ISmartAppRuleConfigValues {
  enableAllRules: boolean;
  enableDaylightRule: boolean;
  enableNightlightRule: boolean;
  enableIdleRule: boolean;
  motionSensors: DeviceContext[];
  motionMultipleAll: boolean;
  motionIdleTimeout: number;
  motionIdleTimeoutUnit: IntervalUnit;
  motionDurationDelay: number;
  dayControlSwitch: DeviceContext; // should be only 1, but it's an array
  dayActiveSwitches: DeviceContext[];
  nightControlSwitch: DeviceContext; // should be only 1, but it's an array
  nightActiveSwitches: DeviceContext[];
  dayNightOffset: number;
  nightEndOffset: number;
  dayStartOffset: number;
}

export interface ISmartAppRuleSwitchLevelConfig {
  deviceId: string;
  switchDayLevel: number;
  switchNightLevel: number;
}

export interface RuleStoreInfo {
  combinedRuleId?: string;
  combinedRule: RuleRequest;
  transitionRuleId?: string;
  transitionRule: RuleRequest;
  newRuleSummary: IRuleSummary;
}
