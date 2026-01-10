import {BearerTokenAuthenticator, SmartThingsClient} from '@smartthings/core-sdk';
import {StatusCodes} from 'http-status-codes';
import {diff} from 'json-diff-ts';
import ruleStore from '../provider/ruleStore';
import {type RuleStoreInfo} from '../types';
import ReturnResultError from '../exceptions/returnResultError';
import {createCombinedRuleFromSummary, createTransitionRuleFromSummary} from './createRuleFromSummaryOperation';
import submitRulesForSmartAppOperation from './submitRulesForSmartAppOperation';
import storeRulesAndNotifyOperation from './storeRulesAndNotifyOperation';

const determineTempDisableValue = (matchingRuleComponent: string, targetRuleComponent: string, coreRuleIsEnabled: boolean, existingValue: boolean, newValue: boolean): boolean =>
  ((targetRuleComponent !== matchingRuleComponent && targetRuleComponent !== 'all') || !coreRuleIsEnabled) ? existingValue : newValue;

const configureRule = async (locationId: string, installedAppId: string, ruleComponent: string, ruleDisabled: boolean): Promise<void> => {
  const appKey = `app-${installedAppId}`;

  const ruleStoreInfo = await ruleStore.get(installedAppId);
  const ruleStoreInfoOrig = JSON.parse(JSON.stringify(ruleStoreInfo)) as RuleStoreInfo;

  // console.log('configuring delete for [', ruleComponent, '] from source values -> paramsDisabled [', paramsDisabled, '] ruleIsEnabled [', ruleIsEnabled, '] disableRule [', disableRule, ']');
  if (!ruleStoreInfo) {
    throw new ReturnResultError(`No rule stored in database for appId [${installedAppId}]`, StatusCodes.UNPROCESSABLE_ENTITY);
  }

  ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule = determineTempDisableValue('daylight', ruleComponent, ruleStoreInfo.newRuleSummary.enableDaylightRule, ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule, ruleDisabled);
  ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule = determineTempDisableValue('nightlight', ruleComponent, ruleStoreInfo.newRuleSummary.enableNightlightRule, ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule, ruleDisabled);
  ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule = determineTempDisableValue('idle', ruleComponent, ruleStoreInfo.newRuleSummary.enableIdleRule, ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule, ruleDisabled);
  ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule = determineTempDisableValue('transition', ruleComponent, ruleStoreInfo.newRuleSummary.enableTransitionRule, ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule, ruleDisabled);
  // do not write these to ruleStoreInfo actual objects because we do not want to actually write temporarily modified rule info there, we want to preserve the native app configured rules
  const combinedRule = createCombinedRuleFromSummary(
    ruleStoreInfo.newRuleSummary
  );
  const transitionRule = createTransitionRuleFromSummary(
    ruleStoreInfo.newRuleSummary
  );

  // this compare should work 100%, but brought in the diff pkg during debugging and using it for now
  // if (JSON.stringify(ruleStoreInfo) === JSON.stringify(ruleStoreInfoOrig)) {
  if (diff(ruleStoreInfo, ruleStoreInfoOrig).length === 0) { // diff returns empty array if no differences
    throw new ReturnResultError('Rules not modified, nothing to update', StatusCodes.NOT_MODIFIED);
  }

  const client = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
  const [newRuleSummary, newCombinedRuleId, newTransitionRuleId] = await submitRulesForSmartAppOperation(
    client,
    locationId,
    appKey,
    combinedRule,
    transitionRule,
    ruleStoreInfo.newRuleSummary
  );

  await storeRulesAndNotifyOperation(
    installedAppId,
    ruleStoreInfo.combinedRule,
    newCombinedRuleId,
    ruleStoreInfo.transitionRule,
    newTransitionRuleId,
    newRuleSummary
  );
};

export default configureRule;
