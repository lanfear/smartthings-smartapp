import {IntervalUnit} from '@smartthings/core-sdk';
import {SmartAppContext} from '@smartthings/smartapp';
import {ISmartAppRuleConfigValues} from '../types';

const readConfigFromContext = async (context: SmartAppContext): Promise<ISmartAppRuleConfigValues> => ({
  enableAllRules: context.configBooleanValue('enableAllRules')?.valueOf(),
  enableDaylightRule: context.configBooleanValue('enableDaylightRule')?.valueOf(),
  enableNightlightRule: context.configBooleanValue('enableNightlightRule')?.valueOf(),
  enableIdleRule: context.configBooleanValue('enableIdleRule')?.valueOf(),
  motionSensors: context.isAuthenticated() && await context.configDevices('motionSensor') || [],
  motionMultipleAll: context.configBooleanValue('motionMultipleAll')?.valueOf(),
  motionIdleTimeout: context.configNumberValue('motionIdleTimeout')?.valueOf(),
  motionIdleTimeoutUnit: context.configBooleanValue('motionIdleTimeoutUnit') ? IntervalUnit.Minute : IntervalUnit.Second,
  motionDurationDelay: context.configNumberValue('motionDurationDelay')?.valueOf(),
  dayControlSwitch: (context.isAuthenticated() && await context.configDevices('dayControlSwitch') || [null])[0],
  dayActiveSwitches: context.isAuthenticated() && await context.configDevices('dayActiveSwitches') || [],
  nightControlSwitch: (context.isAuthenticated() && await context.configDevices('nightControlSwitch') || [null])[0],
  nightActiveSwitches: context.isAuthenticated() && await context.configDevices('nightActiveSwitches') || [],
  dayNightOffset: context.configNumberValue('dayNightOffset')?.valueOf(),
  nightEndOffset: context.configNumberValue('nightEndOffset')?.valueOf(),
  dayStartOffset: context.configNumberValue('dayStartOffset')?.valueOf()
});

export default readConfigFromContext;