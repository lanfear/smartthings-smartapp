import {RuleRequest} from '@smartthings/core-sdk';

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

export interface ISmartAppRuleConfig {
  [switchLevel: string]: ISmartAppRuleSwitchLevel[] | ISmartAppRuleSwitch [] | ISmartAppRuleMotion [];
  dayNightOffset: ISmartAppRuleTimeOffset [];
  nightEndOffset: ISmartAppRuleTimeOffset [];
  dayStartOffset: ISmartAppRuleTimeOffset [];
  dayControlSwitch: ISmartAppRuleSwitch []; // should be only 1, but it's an array
  dayActiveSwitches: ISmartAppRuleSwitch [];
  nightControlSwitch: ISmartAppRuleSwitch []; // should be only 1, but it's an array
  nightActiveSwitches: ISmartAppRuleSwitch [];
  motionSensor: ISmartAppRuleMotion [];
  motionIdleTimeout: ISmartAppRuleTimeOffset[];
  motionDurationDelay: ISmartAppRuleTimeOffset[];
}

export interface RuleStoreInfo {
  dayRuleId?: string;
  nightRuleId?: string;
  idleRuleId?: string;
  transitionRuleId?: string;
  dayLightRule?: RuleRequest;
  nightLightRule?: RuleRequest;
  idleRule?: RuleRequest;
  transitionRule?: RuleRequest;
}

export interface IRuleSwitchLevelInfo {
  deviceId: string;
  switchLevel: number;
}