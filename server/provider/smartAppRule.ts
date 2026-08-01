import type {Device, RuleRequest} from '@smartthings/core-sdk';
import {SmartApp, type ContextStore} from '@smartthings/smartapp';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import type {ISmartAppRuleConfigValues, Nullable} from 'types';
import global from '../constants/global';
import uniqueDeviceFactory from '../factories/uniqueDeviceFactory';
import {createCombinedRuleFromSummary, createTransitionRuleFromSummary} from '../operations/createRuleFromSummaryOperation';
import createRuleSummaryFromConfig from '../operations/createRuleSummaryFromConfigOperation';
import listDevicesFromApiOperation from '../operations/listDevicesFromApiOperation';
import readConfigFromContext, {readDeviceLevelConfigFromContext} from '../operations/readConfigFromContext';
import storeRulesAndNotifyOperation from '../operations/storeRulesAndNotifyOperation';
import submitRulesForSmartAppOperation from '../operations/submitRulesForSmartAppOperation';
import type {IRuleSwitchLevelInfo} from '../types/sharedContracts';
import ruleStore from './ruleStore';
import settings from './settings';
import smartAppContextStore from './smartAppContextStore';
import getSmartThingsClient from './smartThingsClient';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const noonHour = 12;
const offset6Hours = 360;
const increment5 = 5;
const hourOffset8 = 8;
const hourOffset20 = 20;

// const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const contextStore: ContextStore = smartAppContextStore(settings.ruleAppId);

const rulesAreModified = async (ruleStoreKey: string, newRule: Nullable<RuleRequest>): Promise<boolean> => {
  const existingRules = await ruleStore.get(ruleStoreKey);
  return (!existingRules || JSON.stringify(newRule) !== JSON.stringify(existingRules.combinedRule));
};

/* Define the SmartApp */
export default new SmartApp()
  .enableEventLogging()
  .configureI18n()
  .permissions(['r:devices:*', 'x:devices:*', 'r:rules:*', 'w:rules:*'])
  .appId(settings.ruleAppId)
  .clientId(settings.ruleClientId)
  .clientSecret(settings.ruleClientSecret)
  .contextStore(contextStore)

// Configuration page definition
  .page('rulesMainPage', async (context, page /* , configData */) => {
    const config = await readConfigFromContext(context);

    page.section('description', section => {
      if (!config.dayControlSwitch || !config.nightControlSwitch) {
      // eslint-disable-next-line no-console
        console.warn('Day or Night control switch not configured in main page, cannot create rules');
        return;
      }

      const uniqueDaySwitches = uniqueDeviceFactory([config.dayControlSwitch].concat(config.dayActiveSwitches));
      const uniqueNightSwitches = uniqueDeviceFactory([config.nightControlSwitch].concat(config.nightActiveSwitches));
      const uniqueSwitches = uniqueDeviceFactory(uniqueDaySwitches.concat(uniqueNightSwitches));
      const motionSensorNames = config.motionSensors.map(s => s.label).join(config.motionMultipleAll ? ' AND ' : ' OR ');
      const idleMotionSensorNames = config.motionSensors.map(s => s.label).join(!config.motionMultipleAll ? ' AND ' : ' OR ');

      const dayStartTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayStartOffset, 'minutes').format('hh:mm A');
      const dayNightTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayNightOffset, 'minutes').format('hh:mm A');
      const nightEndTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.nightEndOffset, 'minutes').format('hh:mm A');

      // these strings are not localized because i'm unsure how to use the built-in I18n mechanics with dynamic config-driven values interpolated
      const daylightRuleDescription = `DAYLIGHT RULE: Between [${dayStartTime}] and [${dayNightTime}] `
        + `When [${motionSensorNames}] are ACTIVE for [${config.motionDurationDelay} second(s)] `
        + `these devices [${uniqueDaySwitches.map(s => s.label).join(', ')}] `
        + 'will turn ON.';
      const daylightRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableDaylightRule ? 'ENABLED' : 'DISABLED'}`;

      const nightlightRuleDescription = `NIGHTLIGHT RULE: Between [${dayNightTime}] and [${nightEndTime}] `
        + `When [${motionSensorNames}] are ACTIVE for [${config.motionDurationDelay} second(s)] `
        + `these devices [${uniqueNightSwitches.map(s => s.label).join(', ')}] `
        + 'will turn ON.';
      const nightlightRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableNightlightRule ? 'ENABLED' : 'DISABLED'}`;

      const idleRuleDescription = `IDLE RULE: When [${idleMotionSensorNames}] are INACTIVE for [${config.motionIdleTimeout} ${config.motionIdleTimeoutUnit}(s)] `
        + `these devices [${uniqueSwitches.map(s => s.label).join(', ')}] `
        + 'will turn OFF.';
      const idleRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableIdleRule ? 'ENABLED' : 'DISABLED'}`;

      const transitionRuleDescription = `TRANSITION RULE: At [${dayNightTime}] `
        + `these devices [${uniqueDaySwitches.map(s => s.label).join(', ')}] will turn OFF (or be modified to their Night levels) `
        + `and [${uniqueNightSwitches.map(s => s.label).join(', ')}] will turn ON (or be modified to their Night levels).`;
      const transitionRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableDaylightRule && config.enableNightlightRule ? 'ENABLED' : 'DISABLED'}`;

      section
        .paragraphSetting('daylightRuleSummary')
        .name(daylightRuleDescription)
        .description(daylightRuleEnabledDesc);

      section
        .paragraphSetting('nightlightRuleSummary')
        .name(nightlightRuleDescription)
        .description(nightlightRuleEnabledDesc);

      section
        .paragraphSetting('idleRuleSummary')
        .name(idleRuleDescription)
        .description(idleRuleEnabledDesc);

      section
        .paragraphSetting('transitionRuleSummary')
        .name(transitionRuleDescription)
        .description(transitionRuleEnabledDesc);
    });

    page.section('types', section => {
      section.hideable(true);
      section.booleanSetting('enableAllRules').defaultValue('true');
      section.booleanSetting('enableDaylightRule').defaultValue('true');
      section.booleanSetting('enableNightlightRule').defaultValue('true');
      section.booleanSetting('enableIdleRule').defaultValue('true');
    });

    page.section('tempDisable', section => {
      section.hideable(true);
      section.hidden(true);
      section.booleanSetting('tempDisableAllRules').defaultValue('false');
      section.booleanSetting('tempDisableDaylightRule').defaultValue('false');
      section.booleanSetting('tempDisableNightlightRule').defaultValue('false');
      section.booleanSetting('tempDisableIdleRule').defaultValue('false');
      section.booleanSetting('tempDisableTransitionRule').defaultValue('false');
    });

    page.section('sensors', section => {
      section.hideable(true);
      section
        .deviceSetting('motionSensor')
        .capabilities(['motionSensor'])
        .multiple(true)
        .required(true);

      section.numberSetting('motionDurationDelay')
        .min(0)
        .max(60)
        .step(increment5)
        .defaultValue(0);

      section.numberSetting('motionIdleTimeout')
        .min(0)
        .max(offset6Hours)
        .step(increment5)
        .defaultValue(0);

      section.booleanSetting('motionIdleTimeoutUnit');

      section.booleanSetting('motionMultipleAll');
    });

    page.section('switches', section => {
      section.hideable(true);
      section
        .deviceSetting('dayControlSwitch')
        .capabilities(['switch'])
        .required(true)
        .permissions('rx')
        .submitOnChange(true);

      section
        .deviceSetting('dayActiveSwitches')
        .capabilities(['switch'])
        .multiple(true)
        .permissions('rx')
        .submitOnChange(true);

      section
        .deviceSetting('nightControlSwitch')
        .capabilities(['switch'])
        .required(true)
        .permissions('rx')
        .submitOnChange(true);

      section
        .deviceSetting('nightActiveSwitches')
        .capabilities(['switch'])
        .multiple(true)
        .permissions('rx')
        .submitOnChange(true);
    });

    page.section('timings', section => {
      section.hideable(true);
      // from 8AM
      section.timeSetting('dayStartOffsetTime')

        .defaultValue(dayjs().hour(hourOffset8).minute(0).second(0).millisecond(0).toISOString());

      // from 8PM
      section.timeSetting('dayNightOffsetTime')

        .defaultValue(dayjs().hour(hourOffset20).minute(0).second(0).millisecond(0).toISOString());

      // from 8AM
      section.timeSetting('nightEndOffsetTime')

        .defaultValue(dayjs().hour(hourOffset8).minute(0).second(0).millisecond(0).toISOString());
    });

    // i know this does something, even though apparently the typedefs say otherwise
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await page.section('levels', async section => {
      section.hideable(true);

      let allDimmableSwitches: Device[];
      try {
        allDimmableSwitches = await listDevicesFromApiOperation({capability: 'switchLevel'});
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('api lookup failed even though isAuthenticated', e);
        return;
      }

      const daySwitches = (config.dayControlSwitch ? [config.dayControlSwitch] : []).concat(config.dayActiveSwitches)
        .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
      const nightSwitches = (config.nightControlSwitch ? [config.nightControlSwitch] : []).concat(config.nightActiveSwitches)
        .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
      const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
      const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));

      if (dayDimmableSwitches.length === 0 && nightDimmableSwitches.length === 0) {
        section.paragraphSetting('levelEmpty');
        return;
      }

      dayDimmableSwitches.forEach(s => {
        section.numberSetting(`dayLevel${s.deviceId}`)
          .name(`${s.label} Day Dimming Level`)
          .min(10)
          .max(100)
          .step(increment5)
          .defaultValue(global.rule.default.switchDayLevel);
        // slider would be nice, but UI provides no numerical feedback, so worthless =\

        // @disabled-ts-expect-error
        // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
      });

      nightDimmableSwitches.forEach(s => {
        section.numberSetting(`nightLevel${s.deviceId}`)
          .name(`${s.label} Night Dimming Level`)
          .min(10)
          .max(100)
          .step(increment5)
          .defaultValue(global.rule.default.switchNightLevel);
        // slider would be nice, but UI provides no numerical feedback, so worthless =\

        // @disabled-ts-expect-error
        // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
      });
    });
  })

  .updated(async (context, updateData) => {
    if (!context.isAuthenticated()) {
      // if you havent ever accepted scopes (new install, etc) we cannot do device lookups below successfully, bail now
      return;
    }

    const appKey = `app-${updateData.installedApp.installedAppId}`;

    const newConfig = await readConfigFromContext(context);

    if (!newConfig.dayControlSwitch || !newConfig.nightControlSwitch) {
      // eslint-disable-next-line no-console
      console.warn('Day or Night control switch not configured in updated, cannot create rules');
      return;
    }

    const allDimmableSwitches = await listDevicesFromApiOperation({capability: 'switchLevel'});
    const uniqueDaySwitches = uniqueDeviceFactory([newConfig.dayControlSwitch].concat(newConfig.dayActiveSwitches));
    const uniqueNightSwitches = uniqueDeviceFactory([newConfig.nightControlSwitch].concat(newConfig.nightActiveSwitches));
    const uniqueSwitches = uniqueDeviceFactory(uniqueDaySwitches.concat(uniqueNightSwitches));

    const allConfigSwitchLevels = readDeviceLevelConfigFromContext(context, uniqueSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId)));
    const dayDimmableSwitches = uniqueDaySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const nightDimmableSwitches = uniqueNightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const dayNonDimmableSwitches = uniqueDaySwitches.filter(s => !allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const nightNonDimmableSwitches = uniqueNightSwitches.filter(s => !allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));

    // the find here better work because all switches needs to map to the valid dimmable switch the user configured
    const dayDimmableSwitchLevels = dayDimmableSwitches.map(s => ({deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId)!.switchDayLevel} as IRuleSwitchLevelInfo));
    const nightDimmableSwitchLevels = nightDimmableSwitches.map(s => ({deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId)!.switchNightLevel} as IRuleSwitchLevelInfo));

    const newRuleSummary = createRuleSummaryFromConfig(
      newConfig as ISmartAppRuleConfigValues, // above we ensured the conflicting nullable values are not null, so it is this type
      uniqueDaySwitches,
      dayDimmableSwitches,
      dayNonDimmableSwitches,
      dayDimmableSwitchLevels,
      uniqueNightSwitches,
      nightDimmableSwitches,
      nightNonDimmableSwitches,
      nightDimmableSwitchLevels,
      updateData.installedApp.installedAppId,
      [] // will be filled in
    );

    // the smartapp's own tempDisable* config fields are hidden/unused (see the 'tempDisable' page section above) - the
    // web dashboard is the only real writer of this state, so preserve whatever it last set instead of letting an
    // ordinary config resave (e.g. just opening/closing the settings screen) silently reset it back to false
    const existingRuleStoreInfo = await ruleStore.get(updateData.installedApp.installedAppId);
    if (existingRuleStoreInfo) {
      newRuleSummary.tempDisableAllRules = existingRuleStoreInfo.newRuleSummary.tempDisableAllRules;
      newRuleSummary.tempDisableDaylightRule = existingRuleStoreInfo.newRuleSummary.tempDisableDaylightRule;
      newRuleSummary.tempDisableNightlightRule = existingRuleStoreInfo.newRuleSummary.tempDisableNightlightRule;
      newRuleSummary.tempDisableIdleRule = existingRuleStoreInfo.newRuleSummary.tempDisableIdleRule;
      newRuleSummary.tempDisableTransitionRule = existingRuleStoreInfo.newRuleSummary.tempDisableTransitionRule;
    }

    const newCombinedRule = createCombinedRuleFromSummary(newRuleSummary);
    const newTransitionRule = createTransitionRuleFromSummary(newRuleSummary);

    // TODO: think rulesAreModified should really check both combined rule and transition rule
    if (await rulesAreModified(updateData.installedApp.installedAppId, newCombinedRule)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_unused, newCombinedRuleId, newTransitionRuleId] = await submitRulesForSmartAppOperation(
        getSmartThingsClient(),
        context.api.locations.locationId(),
        appKey,
        newCombinedRule,
        newTransitionRule,
        newRuleSummary
      );

      await storeRulesAndNotifyOperation(
        updateData.installedApp.installedAppId,
        newCombinedRule,
        newCombinedRuleId,
        newTransitionRule,
        newTransitionRuleId,
        newRuleSummary
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('Rules not modified, nothing to update');
    }
  });
