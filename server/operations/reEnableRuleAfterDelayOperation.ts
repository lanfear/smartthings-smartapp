import ReturnResultError from '../exceptions/returnResultError';
import settings from '../provider/settings';
import manageRuleApplicationOperation from './manageRuleApplicationOperation';

/* eslint-disable no-console */

// pending re-enable timers, one per install rule component - a newer delay for the same component replaces the old one
const restartDelayTimers = new Map<string, NodeJS.Timeout>();

// for dev we use minutes, for live we use hours
const restartDelayBase = settings.environment !== 'dev' ? 60 * 60 * 1000 : 60 * 1000;

const timerKeyPrefix = (locationId: string, installedAppId: string): string => `${locationId}-${installedAppId}-`;

/** cancel pending re-enables for an install - every rule component, or just `ruleComponent` */
export const cancelReEnableRuleTimers = (locationId: string, installedAppId: string, ruleComponent?: string): void => {
  const prefix = timerKeyPrefix(locationId, installedAppId);
  [...restartDelayTimers].forEach(([key, timer]) => {
    if (ruleComponent ? key === `${prefix}${ruleComponent}` : key.startsWith(prefix)) {
      clearTimeout(timer);
      restartDelayTimers.delete(key);
    }
  });
};

export const reEnableRuleAfterDelay = (locationId: string, installedAppId: string, ruleComponent: string, delayTimeout: number): void => {
  const key = `${timerKeyPrefix(locationId, installedAppId)}${ruleComponent}`;
  cancelReEnableRuleTimers(locationId, installedAppId, ruleComponent);

  restartDelayTimers.set(key, setTimeout(() => {
    restartDelayTimers.delete(key);
    // nothing awaits this, so an error here would be an unhandled rejection - which stops node by default
    manageRuleApplicationOperation(locationId, installedAppId, ruleComponent, false).catch((e: unknown) => {
      if (e instanceof ReturnResultError) {
        // expected outcomes, e.g. the app was uninstalled in the meantime, or the rule is already enabled
        console.info('Timed re-enable of [', ruleComponent, '] for app [', installedAppId, '] skipped: [', e.statusCode, ']', e.message);
      } else {
        console.error('Timed re-enable of [', ruleComponent, '] for app [', installedAppId, '] failed', e);
      }
    });
  }, restartDelayBase * delayTimeout));
};
