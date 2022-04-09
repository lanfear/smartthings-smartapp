import {DeviceContext} from '@smartthings/smartapp';
import dayjs from 'dayjs';
import {IRuleSummary, IRuleSwitchLevelInfo} from 'sharedContracts';
import {ISmartAppRuleConfigValues} from '../types';

const noonHour = 12;

const createRuleSummaryFromConfig = (
  config: ISmartAppRuleConfigValues,
  uniqueDaySwitches: DeviceContext[],
  dayDimmableSwitches: DeviceContext[],
  dayNonDimmableSwitches: DeviceContext[],
  dayDimmableSwitchLevels: IRuleSwitchLevelInfo[],
  uniqueNightSwitches: DeviceContext[],
  nightDimmableSwitches: DeviceContext[],
  nightNonDimmableSwitches: DeviceContext[],
  nightDimmableSwitchLevels: IRuleSwitchLevelInfo[],
  installedAppId: string,
  ruleIds: string[]
): IRuleSummary => {
  const dayStartTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayStartOffset, 'minutes');
  const dayNightTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayNightOffset, 'minutes');
  const nightEndTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.nightEndOffset, 'minutes');

  return {
    dayControlSwitch: config.dayControlSwitch,
    daySwitches: uniqueDaySwitches,
    dayDimmableSwitches: dayDimmableSwitches,
    dayNonDimmableSwitches: dayNonDimmableSwitches,
    dayDimmableSwitchLevels: dayDimmableSwitchLevels,
    nightControlSwitch: config.nightControlSwitch,
    nightSwitches: uniqueNightSwitches,
    nightDimmableSwitches: nightDimmableSwitches,
    nightNonDimmableSwitches: nightNonDimmableSwitches,
    nightDimmableSwitchLevels: nightDimmableSwitchLevels,
    motionSensors: config.motionSensors,
    motionIdleTimeout: config.motionIdleTimeout,
    motionIdleTimeoutUnit: config.motionIdleTimeoutUnit,
    motionDurationDelay: config.motionDurationDelay,
    dayStartTime: dayStartTime.toJSON(),
    dayNightTime: dayNightTime.toJSON(),
    nightEndTime: nightEndTime.toJSON(),
    enableAllRules: config.enableAllRules,
    enableDaylightRule: config.enableDaylightRule,
    enableNightlightRule: config.enableNightlightRule,
    enableIdleRule: config.enableIdleRule,
    enableTransitionRule: config.enableDaylightRule && config.enableNightlightRule,
    installedAppId: installedAppId,
    ruleIds: ruleIds
  };
};

export default createRuleSummaryFromConfig;