import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import reEnableStore from '../provider/reEnableStore';
import ruleStore from '../provider/ruleStore';
import getSmartThingsClient from '../provider/smartThingsClient';
import type {IRuleComponentType, Nullable} from '../types/sharedContracts';

dayjs.extend(utc);
dayjs.extend(timezone);

const msPerMinute = 60 * 1000;
const minutesPerHour = 60;

export interface IRulePauses {
  pausedAll: boolean;
  paused: Record<IRuleComponentType, boolean>;
  // eg. "Daylight until 9:30 PM; Idle until resumed" - null when nothing is paused
  summary: Nullable<string>;
}

const componentNames: Record<IRuleComponentType, string> = {
  daylight: 'Daylight',
  nightlight: 'Nightlight',
  transition: 'Transition',
  idle: 'Idle'
};

// "in 1h 20m" - used when the location's time zone can't be looked up
const formatRelative = (epoch: number): string => {
  const minutes = Math.max(1, Math.round((epoch - Date.now()) / msPerMinute));
  const hours = Math.floor(minutes / minutesPerHour);
  return `in ${hours > 0 ? `${hours}h ` : ''}${minutes % minutesPerHour}m`;
};

/**
 * What the web dashboard has paused for a rule app install, read from the rule store (the only place pauses live - the
 * app's own settings can't be changed by the server), with when each timed pause ends
 */
const describeRulePausesOperation = async (locationId: string, installedAppId: string): Promise<IRulePauses> => {
  const ruleSummary = (await ruleStore.get(installedAppId))?.newRuleSummary;
  const noPauses: IRulePauses = {pausedAll: false, paused: {daylight: false, nightlight: false, transition: false, idle: false}, summary: null};
  if (!ruleSummary?.enableAllRules) {
    return noPauses;
  }

  // a pause only counts for a rule that exists - one disabled in the app's settings isn't running anyway
  const pausedAll = ruleSummary.tempDisableAllRules;
  const paused: Record<IRuleComponentType, boolean> = {
    daylight: ruleSummary.enableDaylightRule && ruleSummary.tempDisableDaylightRule,
    nightlight: ruleSummary.enableNightlightRule && ruleSummary.tempDisableNightlightRule,
    transition: ruleSummary.enableTransitionRule && ruleSummary.tempDisableTransitionRule,
    idle: ruleSummary.enableIdleRule && ruleSummary.tempDisableIdleRule
  };
  const enabledComponents = (Object.keys(componentNames) as IRuleComponentType[]).filter(c => ({
    daylight: ruleSummary.enableDaylightRule,
    nightlight: ruleSummary.enableNightlightRule,
    transition: ruleSummary.enableTransitionRule,
    idle: ruleSummary.enableIdleRule
  })[c]);
  const pausedComponents = enabledComponents.filter(c => pausedAll || paused[c]);
  if (pausedComponents.length === 0) {
    return noPauses;
  }

  // pausing 'all' also flags each rule, so a rule resumes at the earlier of its own timer and the 'all' timer
  const reEnables = await reEnableStore.listForApp(installedAppId);
  const reEnableAt = (component: IRuleComponentType): Nullable<number> => {
    const times = reEnables.filter(r => r.ruleComponent === component || r.ruleComponent === 'all').map(r => r.reEnableAt);
    return times.length > 0 ? Math.min(...times) : null;
  };
  let formatTime = formatRelative;
  if (reEnables.length > 0) {
    try {
      const {timeZoneId} = await getSmartThingsClient().locations.get(locationId);
      formatTime = (epoch: number): string => {
        const at = dayjs(epoch).tz(timeZoneId);
        return at.format(at.isSame(dayjs().tz(timeZoneId), 'day') ? 'h:mm A' : 'ddd h:mm A');
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Location time zone lookup failed, showing relative re-enable times', e);
    }
  }

  const until = (component: IRuleComponentType): string => {
    const at = reEnableAt(component);
    return `until ${at ? formatTime(at) : 'resumed'}`;
  };
  // "All rules until 9:30 PM" when every rule is paused to the same time, else "Daylight until 9:30 PM; Idle until resumed"
  const untils = pausedComponents.map(until);
  const summary = pausedComponents.length === enabledComponents.length && untils.every(u => u === untils[0])
    ? `All rules ${untils[0]}`
    : pausedComponents.map((c, i) => `${componentNames[c]} ${untils[i]}`).join('; ');

  return {pausedAll, paused, summary};
};

export default describeRulePausesOperation;
