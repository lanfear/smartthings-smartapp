import ReturnResultError from '../exceptions/returnResultError';
import reEnableStore, {type IReEnableEntry} from '../provider/reEnableStore';
import settings from '../provider/settings';
import manageRuleApplicationOperation from './manageRuleApplicationOperation';

/* eslint-disable no-console */

// pending re-enable timers, one per install rule component - a newer delay for the same component replaces the old one.
// The re-enable time itself lives in reEnableStore (Redis), which is the source of truth: it survives restarts, and dev
// and live share it, so a timer only acts if its entry is still there unchanged when it fires
const restartDelayTimers = new Map<string, NodeJS.Timeout>();

// for dev we use minutes, for live we use hours
const restartDelayBase = settings.environment !== 'dev' ? 60 * 60 * 1000 : 60 * 1000;

const timerKeyPrefix = (locationId: string, installedAppId: string): string => `${locationId}-${installedAppId}-`;

const clearTimers = (locationId: string, installedAppId: string, ruleComponent?: string): void => {
  const prefix = timerKeyPrefix(locationId, installedAppId);
  [...restartDelayTimers].forEach(([key, timer]) => {
    if (ruleComponent ? key === `${prefix}${ruleComponent}` : key.startsWith(prefix)) {
      clearTimeout(timer);
      restartDelayTimers.delete(key);
    }
  });
};

const fireReEnable = async (entry: IReEnableEntry): Promise<void> => {
  const {locationId, installedAppId, ruleComponent, reEnableAt} = entry;
  // skip if this re-enable was cancelled or replaced since the timer started (possibly by the other server sharing Redis)
  const current = (await reEnableStore.listForApp(installedAppId)).find(e => e.ruleComponent === ruleComponent);
  if (current?.reEnableAt !== reEnableAt) {
    console.info('Timed re-enable of [', ruleComponent, '] for app [', installedAppId, '] skipped: cancelled or replaced');
    return;
  }
  await reEnableStore.remove(installedAppId, ruleComponent);
  await manageRuleApplicationOperation(locationId, installedAppId, ruleComponent, false);
};

const scheduleTimer = (entry: IReEnableEntry): void => {
  const key = `${timerKeyPrefix(entry.locationId, entry.installedAppId)}${entry.ruleComponent}`;
  clearTimers(entry.locationId, entry.installedAppId, entry.ruleComponent);

  restartDelayTimers.set(key, setTimeout(() => {
    restartDelayTimers.delete(key);
    // nothing awaits this, so an error here would be an unhandled rejection - which stops node by default
    fireReEnable(entry).catch((e: unknown) => {
      if (e instanceof ReturnResultError) {
        // expected outcomes, e.g. the app was uninstalled in the meantime, or the rule is already enabled
        console.info('Timed re-enable of [', entry.ruleComponent, '] for app [', entry.installedAppId, '] skipped: [', e.statusCode, ']', e.message);
      } else {
        console.error('Timed re-enable of [', entry.ruleComponent, '] for app [', entry.installedAppId, '] failed', e);
      }
    });
  }, Math.max(0, entry.reEnableAt - Date.now())));
};

/** cancel pending re-enables for an install - every rule component, or just `ruleComponent` */
export const cancelReEnableRuleTimers = async (locationId: string, installedAppId: string, ruleComponent?: string): Promise<void> => {
  clearTimers(locationId, installedAppId, ruleComponent);
  await reEnableStore.remove(installedAppId, ruleComponent);
};

/** re-enable a rule component after `delayTimeout` hours (minutes in dev) */
export const reEnableRuleAfterDelay = async (locationId: string, installedAppId: string, ruleComponent: string, delayTimeout: number): Promise<void> => {
  const entry: IReEnableEntry = {
    locationId: locationId,
    installedAppId: installedAppId,
    ruleComponent: ruleComponent,
    reEnableAt: Date.now() + (restartDelayBase * delayTimeout)
  };
  await reEnableStore.set(entry);
  scheduleTimer(entry);
};

/** on startup, restart the timers of re-enables still pending in Redis - ones already overdue fire right away */
export const restoreReEnableRuleTimers = async (): Promise<void> => {
  const entries = await reEnableStore.list();
  entries.forEach(scheduleTimer);
  if (entries.length > 0) {
    console.info('Restored [', entries.length, '] pending timed re-enable(s)');
  }
};
