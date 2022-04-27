import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {RuleRequest} from '@smartthings/core-sdk';
import {IRuleSummary} from 'sharedContracts';
import uniqueDeviceFactory from '../factories/uniqueDeviceFactory';
import createCombinedRuleFromConfig from './createCombinedRuleFromConfigOperation';
import createIdleRuleFromConfig from './createIdleRuleFromConfigOperation';
import createTransitionRuleFromConfig from './createTransitionRuleFromConfigOperation';
import createTriggerRuleFromConfig from './createTriggerRuleFromConfigOperation';

dayjs.extend(utc);

export const createCombinedRuleFromSummary = (ruleSummary: IRuleSummary, dayRuleEnabled: boolean, nightRuleEnabled: boolean, idleRuleEnabled: boolean): RuleRequest => {
  if (!ruleSummary || !ruleSummary.enableAllRules) {
    return null;
  }

  const dayStartTime = dayjs(ruleSummary.dayStartTime).utc().diff(dayjs(ruleSummary.dayStartTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers
  const dayNightTime = dayjs(ruleSummary.dayNightTime).utc().diff(dayjs(ruleSummary.dayNightTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers
  const nightEndTime = dayjs(ruleSummary.nightEndTime).utc().diff(dayjs(ruleSummary.nightEndTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers

  const uniqueSwitches = uniqueDeviceFactory(ruleSummary.daySwitches.concat(ruleSummary.nightSwitches));
  
  /* eslint-disable no-mixed-operators */
  const newDayRule = dayRuleEnabled && ruleSummary.enableDaylightRule && createTriggerRuleFromConfig(
    dayStartTime,
    dayNightTime,
    ruleSummary.motionSensors.map(d => d.deviceId),
    ruleSummary.dayControlSwitch.deviceId,
    ruleSummary.dayDimmableSwitchLevels,
    ruleSummary.dayNonDimmableSwitches.map(s => s.deviceId),
    ruleSummary.motionMultipleAll,
    ruleSummary.motionDurationDelay
  ) || null;

  const newNightRule = nightRuleEnabled && ruleSummary.enableNightlightRule && createTriggerRuleFromConfig(
    dayNightTime,
    nightEndTime,
    ruleSummary.motionSensors.map(d => d.deviceId),
    ruleSummary.nightControlSwitch.deviceId,
    ruleSummary.nightDimmableSwitchLevels,
    ruleSummary.nightNonDimmableSwitches.map(s => s.deviceId),
    ruleSummary.motionMultipleAll,
    ruleSummary.motionDurationDelay
  ) || null;

  const newIdleRule = idleRuleEnabled && ruleSummary.enableIdleRule && createIdleRuleFromConfig(
    ruleSummary.motionSensors.map(d => d.deviceId),
    uniqueSwitches.map(d => d.deviceId),
    ruleSummary.motionIdleTimeout,
    ruleSummary.motionIdleTimeoutUnit,
    !ruleSummary.motionMultipleAll // you invert this setting for the idle case
  ) || null;

  const appKey = `app-${ruleSummary.installedAppId}`;
  return createCombinedRuleFromConfig(
    appKey,
    newDayRule,
    newNightRule,
    newIdleRule
  );
};

export const createTransitionRuleFromSummary = (ruleSummary: IRuleSummary, transitionRuleEnabled: boolean): RuleRequest => {
  if (!ruleSummary || !ruleSummary.enableAllRules) {
    return null;
  }

  const dayNightTime = dayjs(ruleSummary.dayNightTime).utc().diff(dayjs(ruleSummary.dayNightTime).utc().hour(12).minute(0).second(0).millisecond(0), 'minute'); // eslint-disable-line no-magic-numbers

  const appKey = `app-${ruleSummary.installedAppId}`;
  return transitionRuleEnabled && ruleSummary.enableTransitionRule && createTransitionRuleFromConfig(
    appKey,
    dayNightTime,
    ruleSummary.daySwitches.map(s => s.deviceId),
    ruleSummary.nightDimmableSwitchLevels,
    ruleSummary.nightNonDimmableSwitches.map(s => s.deviceId)
  ) || null;
  /* eslint-enable no-mixed-operators */
};
