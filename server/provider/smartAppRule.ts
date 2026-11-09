import type {Device, RuleRequest} from '@smartthings/core-sdk';
import {SmartApp, type ContextStore} from '@smartthings/smartapp';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import type {ISmartAppRuleConfigValues} from 'types';
import global from '../constants/global';
import {generateRuleAppKey} from '../factories/ruleFactory';
import uniqueDeviceFactory from '../factories/uniqueDeviceFactory';
import {createCombinedRuleFromSummary, createTransitionRuleFromSummary} from '../operations/createRuleFromSummaryOperation';
import createRuleSummaryFromConfig from '../operations/createRuleSummaryFromConfigOperation';
import deleteRulesForSmartAppOperation from '../operations/deleteRulesForSmartAppOperation';
import describeRulePausesOperation from '../operations/describeRulePausesOperation';
import listDevicesFromApiOperation from '../operations/listDevicesFromApiOperation';
import readConfigFromContext, {readDeviceLevelConfigFromContext} from '../operations/readConfigFromContext';
import storeRulesAndNotifyOperation from '../operations/storeRulesAndNotifyOperation';
import submitRulesForSmartAppOperation from '../operations/submitRulesForSmartAppOperation';
import type {IRuleComponentType, IRuleSwitchLevelInfo, Nullable} from '../types/sharedContracts';
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
  .configureI18n({directory: settings.localesDirectory})
  // no location-wide scopes: rules and device lookups use API_TOKEN, and reading the chosen devices is granted by the
  // device settings themselves. (Was r/x:devices:* + r/w:rules:* - trying whether dropping them stops the Allow prompt
  // on every save)
  .permissions([])
  .appId(settings.ruleAppId)
  .clientId(settings.ruleClientId)
  .clientSecret(settings.ruleClientSecret)
  .contextStore(contextStore)

// Configuration page definition
  .page('rulesMainPage', async (context, page /* , configData */) => {
    const config = await readConfigFromContext(context);

    // each section opens with a plain-language summary of what its settings currently do. These strings aren't
    // localized because the built-in I18n can't interpolate config-driven values
    const rulesEnabled: Record<IRuleComponentType, boolean> = {
      daylight: config.enableAllRules && config.enableDaylightRule,
      nightlight: config.enableAllRules && config.enableNightlightRule,
      idle: config.enableAllRules && config.enableIdleRule,
      transition: config.enableAllRules && config.enableDaylightRule && config.enableNightlightRule
    };

    // pauses are set from the web dashboard and live only in the rule store - shown here, but not editable
    const {installedAppId, locationId} = context as unknown as {installedAppId: string; locationId: string}; // set at runtime, missing from the SDK typings
    const pauses = await describeRulePausesOperation(locationId, installedAppId).catch((e: unknown) => {
      // eslint-disable-next-line no-console
      console.warn('Reading rule pauses failed, config page shows none', e);
      return null;
    });
    const isPaused = (component: IRuleComponentType): boolean => Boolean(pauses && (pauses.pausedAll || pauses.paused[component]));

    // "Name", "Name (paused)" or "Name (disabled)" for the rules that title covers
    const ruleTitle = (name: string, components: IRuleComponentType[]): string => {
      const running = components.filter(c => rulesEnabled[c]);
      if (running.length === 0) {
        return `${name} (disabled)`;
      }
      return running.every(isPaused) ? `${name} (paused)` : name;
    };
    const plural = (count: number, word: string): string => `${count} ${word.toLowerCase()}${count === 1 ? '' : 's'}`;
    const labels = (devices: {label?: string}[]): string => devices.map(d => d.label).join(', ');
    const formatOffset = (offset: number): string => dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(offset, 'minutes').format('h:mm A');

    // "A or B is active" / "A and B are active"
    const sensorPhrase = (joinWithAnd: boolean, state: string): string => {
      const names = config.motionSensors.map(s => s.label).join(joinWithAnd ? ' and ' : ' or ');
      return `${names} ${joinWithAnd && config.motionSensors.length > 1 ? 'are' : 'is'} ${state}`;
    };

    const switchesConfigured = Boolean(config.dayControlSwitch && config.nightControlSwitch);
    const uniqueDaySwitches = uniqueDeviceFactory((config.dayControlSwitch ? [config.dayControlSwitch] : []).concat(config.dayActiveSwitches));
    const uniqueNightSwitches = uniqueDeviceFactory((config.nightControlSwitch ? [config.nightControlSwitch] : []).concat(config.nightActiveSwitches));
    const dayStartTime = formatOffset(config.dayStartOffset);
    const dayNightTime = formatOffset(config.dayNightOffset);
    const nightEndTime = formatOffset(config.nightEndOffset);

    page.section('types', section => {
      section.hideable(true);

      const ruleNames: [IRuleComponentType, string][] = [['daylight', 'Daylight'], ['nightlight', 'Nightlight'], ['transition', 'Transition'], ['idle', 'Idle']];
      const enabledRules = ruleNames.filter(([c]) => rulesEnabled[c]);
      const activeRules = enabledRules.filter(([c]) => !isPaused(c)).map(([, name]) => name);
      section
        .paragraphSetting('activeRulesSummary')
        .name('Active rules')
        .description(activeRules.length > 0
          ? activeRules.join(', ')
          : `None, all rules are ${enabledRules.length > 0 ? 'paused' : 'disabled'}`);

      if (pauses?.summary) {
        section
          .paragraphSetting('pausedRulesSummary')
          .name('Paused from the web dashboard')
          .description(pauses.summary);
      }

      section.booleanSetting('enableAllRules').defaultValue('true');
      section.booleanSetting('enableDaylightRule').defaultValue('true');
      section.booleanSetting('enableNightlightRule').defaultValue('true');
      section.booleanSetting('enableIdleRule').defaultValue('true');
    });

    page.section('sensors', section => {
      section.hideable(true);

      if (config.motionSensors.length > 0) {
        section
          .paragraphSetting('motionOnSummary')
          .name(ruleTitle('Lights on (Daylight & Nightlight Rules)', ['daylight', 'nightlight']))
          .description(`When ${sensorPhrase(config.motionMultipleAll, 'active')} for ${plural(config.motionDurationDelay, 'second')}`);

        section
          .paragraphSetting('motionOffSummary')
          .name(ruleTitle('Lights off (Idle Rule)', ['idle']))
          .description(`When ${sensorPhrase(!config.motionMultipleAll, 'inactive')} for ${plural(config.motionIdleTimeout, config.motionIdleTimeoutUnit)}`);
      }

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

      if (uniqueDaySwitches.length > 0) {
        section
          .paragraphSetting('daySwitchesSummary')
          .name(ruleTitle('Daylight Rule', ['daylight']))
          .description(`Motion turns on ${labels(uniqueDaySwitches)}`);
      }

      if (uniqueNightSwitches.length > 0) {
        section
          .paragraphSetting('nightSwitchesSummary')
          .name(ruleTitle('Nightlight Rule', ['nightlight']))
          .description(`Motion turns on ${labels(uniqueNightSwitches)}`);
      }

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

      section
        .paragraphSetting('scheduleSummary')
        .name('Schedule')
        .description(`Daylight ${dayStartTime} – ${dayNightTime}, Nightlight ${dayNightTime} – ${nightEndTime}`);

      if (switchesConfigured) {
        // mirrors createTransitionRuleFromConfig: runs only if a daylight switch is on; daylight-only switches turn off,
        // every nightlight switch (including ones shared with daylight) moves to its night level / turns on
        const dayOnlySwitches = uniqueDaySwitches.filter(d => !uniqueNightSwitches.some(n => n.deviceId === d.deviceId));
        const verb = (devices: unknown[], singular: string, multiple: string): string => (devices.length === 1 ? singular : multiple);
        const changes = [
          dayOnlySwitches.length > 0 ? `${labels(dayOnlySwitches)} ${verb(dayOnlySwitches, 'turns', 'turn')} off` : null,
          `${labels(uniqueNightSwitches)} ${verb(uniqueNightSwitches, 'switches', 'switch')} to Nightlight`
        ].filter(Boolean);

        section
          .paragraphSetting('transitionSummary')
          .name(ruleTitle('Transition Rule', ['transition']))
          .description(`At ${dayNightTime}, if any Daylight lights are on, ${changes.join(' and ')}`);
      }

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

    const appKey = generateRuleAppKey(updateData.installedApp.installedAppId);

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
    const dayDimmableSwitchLevels = dayDimmableSwitches.map((s): IRuleSwitchLevelInfo => ({deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId)!.switchDayLevel}));
    const nightDimmableSwitchLevels = nightDimmableSwitches.map((s): IRuleSwitchLevelInfo => ({deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId)!.switchNightLevel}));

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

    // pauses (tempDisable*) aren't app settings - the web dashboard is their only writer, so carry over whatever it last
    // set instead of letting an ordinary config resave (e.g. just opening/closing the settings screen) clear them
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
  })

  // the install's rules are owned by the API_TOKEN user, so SmartThings won't remove them with the app - clean them up
  .uninstalled(async (_context, uninstallData) => {
    const {installedAppId, locationId} = uninstallData.installedApp;
    try {
      const deletedCount = await deleteRulesForSmartAppOperation(locationId, installedAppId);
      // eslint-disable-next-line no-console
      console.info('Rule app [', installedAppId, '] uninstalled, deleted [', deletedCount, '] rules');
    } catch (e) {
      // never fail the uninstall: SmartThings doesn't retry it, and the SDK only clears the install's stored context
      // after this handler returns
      // eslint-disable-next-line no-console
      console.error('Cleaning up rules for uninstalled rule app [', installedAppId, '] failed', e);
    }
  });
