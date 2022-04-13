import dayjs, {Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {DeviceContext, IRuleSummary} from '../types/sharedContracts';
dayjs.extend(utc);

export interface IRuleRange {
  startTime: Dayjs; // dayjs/time
  endTime: Dayjs; // dayjs/time
  motionDevices: DeviceContext[];
  controlDevice: DeviceContext;
  switchDevices: DeviceContext[];
}

export interface IRuleTransition {
  time: Dayjs;
  transitionOffDevices: DeviceContext[];
  transitionOnDevices: DeviceContext[];
}

export interface IRuleIdle {
  motionTimeout: string;
  motionDevices: DeviceContext[];
  switchDevices: DeviceContext[];
}

// this to factory
const getRulesFromSummary = (ruleSummary: IRuleSummary): { dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle } => {
  const ruleParts: { dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle } = {};

  if (!ruleSummary) {
    return ruleParts;
  }

  if (ruleSummary.enableDaylightRule) {
    ruleParts.dayRule = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      startTime: dayjs.utc(ruleSummary.dayStartTime),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      endTime: dayjs.utc(ruleSummary.dayNightTime),
      motionDevices: ruleSummary.motionSensors,
      controlDevice: ruleSummary.dayControlSwitch,
      switchDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableNightlightRule) {
    ruleParts.nightRule = {
      startTime: dayjs.utc(ruleSummary.dayNightTime),
      endTime: dayjs.utc(ruleSummary.nightEndTime),
      motionDevices: ruleSummary.motionSensors,
      controlDevice: ruleSummary.nightControlSwitch,
      switchDevices: {...ruleSummary.nightDimmableSwitches, ...ruleSummary.nightNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableTransitionRule) {
    ruleParts.transitionRule = {
      time: dayjs.utc(ruleSummary.dayNightTime),
      transitionOffDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches},
      transitionOnDevices: {...ruleSummary.nightDimmableSwitches, ...ruleSummary.nightNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableIdleRule) {
    ruleParts.idleRule = {
      motionTimeout: `${ruleSummary.motionIdleTimeout} ${ruleSummary.motionIdleTimeoutUnit}(s)`,
      motionDevices: ruleSummary.motionSensors,
      switchDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches, ...ruleSummary.nightDimmableSwitches, ...ruleSummary.nightNonDimmableSwitches}
    };
  }

  return ruleParts;
};

export default getRulesFromSummary;

