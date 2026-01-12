import dayjs, {type Dayjs} from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import utc from 'dayjs/plugin/utc';
import type {DeviceContext, IRuleSummary} from '../types/sharedContracts';
dayjs.extend(utc);
dayjs.extend(objectSupport);

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
const getRulesFromSummary = (ruleSummary: IRuleSummary): {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle} => {
  const ruleParts: {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle} = {};

  // the data coming from server is actually off, encoded in UTC when it is local, so... we do this for now
  const now = dayjs();
  let dayStartTime = dayjs(ruleSummary.dayStartTime);
  let dayNightTime = dayjs(ruleSummary.dayNightTime);
  let nightEndTime = dayjs(ruleSummary.nightEndTime);

  dayStartTime = dayjs({year: now.year(), month: now.month(), day: now.date(), hour: dayStartTime.utc().hour(), minute: dayStartTime.utc().minute(), second: 0, milliseconds: 0});
  dayNightTime = dayjs({year: now.year(), month: now.month(), day: now.date(), hour: dayNightTime.utc().hour(), minute: dayNightTime.utc().minute(), second: 0, milliseconds: 0});
  nightEndTime = dayjs({year: now.year(), month: now.month(), day: now.date(), hour: nightEndTime.utc().hour(), minute: nightEndTime.utc().minute(), second: 0, milliseconds: 0});

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

      startTime: dayStartTime,

      endTime: dayNightTime,
      motionDevices: ruleSummary.motionSensors,
      controlDevice: ruleSummary.dayControlSwitch,
      switchDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableNightlightRule) {
    ruleParts.nightRule = {
      startTime: dayNightTime,
      endTime: nightEndTime,
      motionDevices: ruleSummary.motionSensors,
      controlDevice: ruleSummary.nightControlSwitch,
      switchDevices: {...ruleSummary.nightDimmableSwitches, ...ruleSummary.nightNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableTransitionRule) {
    ruleParts.transitionRule = {
      time: dayNightTime,
      transitionOffDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches},
      transitionOnDevices: {...ruleSummary.nightDimmableSwitches, ...ruleSummary.nightNonDimmableSwitches}
    };
  }

  if (ruleSummary.enableIdleRule) {
    ruleParts.idleRule = {
      motionTimeout: `${ruleSummary.motionIdleTimeout}${ruleSummary.motionIdleTimeoutUnit === 'Minute' ? 'm' : 's'}`,
      motionDevices: ruleSummary.motionSensors,
      switchDevices: {...ruleSummary.dayDimmableSwitches, ...ruleSummary.dayNonDimmableSwitches, ...ruleSummary.nightDimmableSwitches, ...ruleSummary.nightNonDimmableSwitches}
    };
  }

  return ruleParts;
};

export default getRulesFromSummary;
