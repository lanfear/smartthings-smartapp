import {Nullable} from 'index';
import manageRuleApplicationOperation from './manageRuleApplicationOperation';

// global cache of promises
const restartDelayTimers: Record<string, Nullable<ReturnType<typeof setTimeout>>> = {};

// for dev we use minutes, for live we use hours
const restartDelayBase = process.env.ENV_TYPE !== 'dev' ? 60 * 60 * 1000 : 60 * 1000;

export const reEnableRuleAfterDelay = (locationId: string, installedAppId: string, ruleComponent: string, delayTimeout: number): void => {
  const cacheKey = `${locationId}-${installedAppId}`;
  if (restartDelayTimers[cacheKey]) {
    clearTimeout(restartDelayTimers[cacheKey]!);
    restartDelayTimers[cacheKey] = null;
  }

  setTimeout(() => {
    void manageRuleApplicationOperation(locationId, installedAppId, ruleComponent, false);
  }, restartDelayBase * delayTimeout);
};
