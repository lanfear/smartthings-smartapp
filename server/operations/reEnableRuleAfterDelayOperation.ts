import type {Nullable} from 'types';
import settings from '../provider/settings';
import manageRuleApplicationOperation from './manageRuleApplicationOperation';

// global cache of promises
const restartDelayTimers: Record<string, Nullable<NodeJS.Timeout>> = {};

// for dev we use minutes, for live we use hours
const restartDelayBase = settings.environment !== 'dev' ? 60 * 60 * 1000 : 60 * 1000;

export const reEnableRuleAfterDelay = (locationId: string, installedAppId: string, ruleComponent: string, delayTimeout: number): void => {
  const cacheKey = `${locationId}-${installedAppId}`;
  if (restartDelayTimers[cacheKey]) {
    // node + eslint cant sort out the nullable bits of this, so annoying
    clearTimeout(restartDelayTimers[cacheKey] as unknown as NodeJS.Timeout);
    restartDelayTimers[cacheKey] = null;
  }

  setTimeout(() => {
    void manageRuleApplicationOperation(locationId, installedAppId, ruleComponent, false);
  }, restartDelayBase * delayTimeout);
};
