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

  const now = dayjs.utc();
  let dayStartTime = dayjs.utc(ruleSummary.dayStartTime).set('year', now.year()).set('month', now.month()).set('date', now.date()).set('second', 0).set('millisecond', 0);
  let dayNightTime = dayjs.utc(ruleSummary.dayNightTime).set('year', now.year()).set('month', now.month()).set('date', now.date()).set('second', 0).set('millisecond', 0);
  let nightEndTime = dayjs.utc(ruleSummary.nightEndTime).set('year', now.year()).set('month', now.month()).set('date', now.date()).set('second', 0).set('millisecond', 0);
  // first we order the time ranges
  if (dayStartTime.isAfter(dayNightTime)) {
    dayStartTime = dayStartTime.subtract(1, 'day');
  }
  if (nightEndTime.isBefore(dayNightTime)) {
    nightEndTime = nightEndTime.add(1, 'day');
  }
  // now if we're +/- 24h on either side we have to adjust (assume no range settings > 24h)
  if (dayStartTime.add(1, 'day') < now) {
    dayStartTime = dayStartTime.add(1, 'day');
    dayNightTime = dayNightTime.add(1, 'day');
    nightEndTime = nightEndTime.add(1, 'day');
  }
  if (nightEndTime.subtract(1, 'day') > now) {
    dayStartTime = dayStartTime.subtract(1, 'day');
    dayNightTime = dayNightTime.subtract(1, 'day');
    nightEndTime = nightEndTime.subtract(1, 'day');
  }

  if (ruleSummary.enableDaylightRule) {
    ruleParts.dayRule = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      startTime: dayjs.utc(dayStartTime),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      endTime: dayjs.utc(dayNightTime),
      motionDevices: ruleSummary.motionSensors,
      controlDevice: ruleSummary.dayControlSwitch,
      switchDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableNightlightRule) {
    ruleParts.nightRule = {
      startTime: dayjs.utc(dayNightTime),
      endTime: dayjs.utc(nightEndTime),
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

