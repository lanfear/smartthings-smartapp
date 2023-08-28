import {ContextStore, SmartApp} from '@smartthings/smartapp';
import {SmartThingsClient, BearerTokenAuthenticator, Device, RuleRequest} from '@smartthings/core-sdk';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import {IRuleSwitchLevelInfo} from '../types/sharedContracts';
import global from '../constants/global';
import ruleStore from './ruleStore';
import smartAppContextStore from './smartAppContextStore';
import createTriggerRuleFromConfig from '../operations/createTriggerRuleFromConfigOperation';
import createIdleRuleFromConfig from '../operations/createIdleRuleFromConfigOperation';
import submitRulesForSmartAppOperation from '../operations/submitRulesForSmartAppOperation';
import createTransitionRuleFromConfig from '../operations/createTransitionRuleFromConfigOperation';
import readConfigFromContext, {readDeviceLevelConfigFromContext} from '../operations/readConfigFromContext';
import uniqueDeviceFactory from '../factories/uniqueDeviceFactory';
import createCombinedRuleFromConfig from '../operations/createCombinedRuleFromConfigOperation';
import createRuleSummaryFromConfig from '../operations/createRuleSummaryFromConfigOperation';
import storeRulesAndNotifyOperation from '../operations/storeRulesAndNotifyOperation';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const noonHour = 12;
const offset6Hours = 360;
const increment5 = 5;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
// const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const contextStore: ContextStore = smartAppContextStore;

const rulesAreModified = async (ruleStoreKey: string, newRule: RuleRequest): Promise<boolean> => {
  // todo: get existing rules
  // const existingRules = ruleStore.get(ruleStoreKey);
  const existingRules = await ruleStore.get(ruleStoreKey);
  return (!existingRules || JSON.stringify(newRule) !== JSON.stringify(existingRules.combinedRule));
};

/* Define the SmartApp */
export default new SmartApp()
  .enableEventLogging()
  .configureI18n()
  .permissions(['r:devices:*', 'x:devices:*', 'r:rules:*', 'w:rules:*'])
  .appId(process.env.RULE_APP_ID)
  .clientId(process.env.RULE_CLIENT_ID)
  .clientSecret(process.env.RULE_CLIENT_SECRET)
  .contextStore(contextStore)

// Configuration page definition
  .page('rulesMainPage', async (context, page /* , configData */) => {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await page.section('description', async section => {
      const config = await readConfigFromContext(context);
      const uniqueDaySwitches = uniqueDeviceFactory([config.dayControlSwitch].concat(config.dayActiveSwitches));
      const uniqueNightSwitches = uniqueDeviceFactory([config.nightControlSwitch].concat(config.nightActiveSwitches));
      const uniqueSwitches = uniqueDeviceFactory(uniqueDaySwitches.concat(uniqueNightSwitches));
      const motionSensorNames = config.motionSensors.map(s => s.label).join(config.motionMultipleAll ? ' AND ' : ' OR ');
      const idleMotionSensorNames = config.motionSensors.map(s => s.label).join(!config.motionMultipleAll ? ' AND ' : ' OR ');

      const dayStartTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayStartOffset, 'minutes').format('hh:mm A');
      const dayNightTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.dayNightOffset, 'minutes').format('hh:mm A');
      const nightEndTime = dayjs().utc().hour(noonHour).minute(0).second(0).millisecond(0).add(config.nightEndOffset, 'minutes').format('hh:mm A');

      // these strings are not localized because i'm unsure how to use the built-in I18n mechanics with dynamic config-driven values interpolated
      const daylightRuleDescription = `DAYLIGHT RULE: Between [${dayStartTime}] and [${dayNightTime}] ` +
        `When [${motionSensorNames}] are ACTIVE for [${config.motionDurationDelay} second(s)] ` +
        `these devices [${uniqueDaySwitches.map(s => s.label).join(', ')}] ` +
        'will turn ON.';
      const daylightRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableDaylightRule ? 'ENABLED' : 'DISABLED'}`;

      const nightlightRuleDescription = `NIGHTLIGHT RULE: Between [${dayNightTime}] and [${nightEndTime}] ` +
        `When [${motionSensorNames}] are ACTIVE for [${config.motionDurationDelay} second(s)] ` +
        `these devices [${uniqueNightSwitches.map(s => s.label).join(', ')}] ` +
        'will turn ON.';
      const nightlightRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableNightlightRule ? 'ENABLED' : 'DISABLED'}`;

      const idleRuleDescription = `IDLE RULE: When [${idleMotionSensorNames}] are INACTIVE for [${config.motionIdleTimeout} ${config.motionIdleTimeoutUnit}(s)] ` +
        `these devices [${uniqueSwitches.map(s => s.label).join(', ')}] ` +
        'will turn OFF.';
      const idleRuleEnabledDesc = `This rule is ${config.enableAllRules && config.enableIdleRule ? 'ENABLED' : 'DISABLED'}`;

      const transitionRuleDescription = `TRANSITION RULE: At [${dayNightTime}] ` +
        `these devices [${uniqueDaySwitches.map(s => s.label).join(', ')}] will turn OFF (or be modified to their Night levels) ` +
        `and [${uniqueNightSwitches.map(s => s.label).join(', ')}] will turn ON (or be modified to their Night levels).`;
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
        // eslint-disable-next-line no-magic-numbers
        .defaultValue(dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString());

      // from 8PM
      section.timeSetting('dayNightOffsetTime')
        // eslint-disable-next-line no-magic-numbers
        .defaultValue(dayjs().hour(20).minute(0).second(0).millisecond(0).toISOString());

      // from 8AM
      section.timeSetting('nightEndOffsetTime')
        // eslint-disable-next-line no-magic-numbers
        .defaultValue(dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString());
    });

    // i know this does something, even though apparently the typedefs say otherwise
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await page.section('levels', async section => {
      section.hideable(true);

      if (!context.isAuthenticated()) {
        section
          .paragraphSetting('levelNotAuthorized');
        // if you havent ever accepted scopes (new install, etc) we cannot do device lookups below successfully, bail now
        return;
      }

      let allDimmableSwitches: Device[];
      try {
        allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('api lookup failed even though isAuthenticated', e);
        return;
      }

      const daySwitches = ((await context.configDevices('dayControlSwitch')) ?? []).concat((await context.configDevices('dayActiveSwitches')) ?? [])
        .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
      const nightSwitches = ((await context.configDevices('nightControlSwitch')) ?? []).concat((await context.configDevices('nightActiveSwitches')) ?? [])
        .filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
      const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
      const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));

      dayDimmableSwitches.forEach(s => {
        section.numberSetting(`dayLevel${s.deviceId}`)
          .name(`${s.label} Day Dimming Level`)
          .min(10)
          .max(100)
          .step(increment5)
          .defaultValue(global.rule.default.switchDayLevel);
        // slider would be nice, but UI provides no numerical feedback, so worthless =\
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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

    const allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
    const uniqueDaySwitches = uniqueDeviceFactory([newConfig.dayControlSwitch].concat(newConfig.dayActiveSwitches));
    const uniqueNightSwitches = uniqueDeviceFactory([newConfig.nightControlSwitch].concat(newConfig.nightActiveSwitches));
    const uniqueSwitches = uniqueDeviceFactory(uniqueDaySwitches.concat(uniqueNightSwitches));

    const allConfigSwitchLevels = readDeviceLevelConfigFromContext(context, uniqueSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId)));
    const dayDimmableSwitches = uniqueDaySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const nightDimmableSwitches = uniqueNightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const dayNonDimmableSwitches = uniqueDaySwitches.filter(s => !allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));
    const nightNonDimmableSwitches = uniqueNightSwitches.filter(s => !allDimmableSwitches.find(ss => ss.deviceId === s.deviceId));

    const dayDimmableSwitchLevels = dayDimmableSwitches.map(s => ({deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId).switchDayLevel} as IRuleSwitchLevelInfo));
    const nightDimmableSwitchLevels = nightDimmableSwitches.map(s => ({deviceId: s.deviceId, switchLevel: allConfigSwitchLevels.find(l => l.deviceId === s.deviceId).switchNightLevel} as IRuleSwitchLevelInfo));

    const dayRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule');
    const nightRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableNightlightRule');
    const idleRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableIdleRule');
    const transitionRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule') && context.configBooleanValue('enableNightlightRule');

    /* eslint-disable no-mixed-operators */
    const newDayRule = dayRuleEnabled && createTriggerRuleFromConfig(
      newConfig.dayStartOffset,
      newConfig.dayNightOffset,
      newConfig.motionSensors.map(d => d.deviceId),
      newConfig.dayControlSwitch.deviceId,
      dayDimmableSwitchLevels,
      dayNonDimmableSwitches.map(s => s.deviceId),
      newConfig.motionMultipleAll,
      newConfig.motionDurationDelay
    ) || null;

    const newNightRule = nightRuleEnabled && createTriggerRuleFromConfig(
      newConfig.dayNightOffset,
      newConfig.nightEndOffset,
      newConfig.motionSensors.map(d => d.deviceId),
      newConfig.nightControlSwitch.deviceId,
      nightDimmableSwitchLevels,
      nightNonDimmableSwitches.map(s => s.deviceId),
      newConfig.motionMultipleAll,
      newConfig.motionDurationDelay
    ) || null;

    const newIdleRule = idleRuleEnabled && createIdleRuleFromConfig(
      newConfig.motionSensors.map(d => d.deviceId),
      uniqueSwitches.map(d => d.deviceId),
      newConfig.motionIdleTimeout,
      newConfig.motionIdleTimeoutUnit,
      !newConfig.motionMultipleAll // you invert this setting for the idle case
    ) || null;

    const newTransitionRule = transitionRuleEnabled && createTransitionRuleFromConfig(
      appKey,
      newConfig.dayNightOffset,
      uniqueDaySwitches.map(s => s.deviceId),
      nightDimmableSwitchLevels,
      nightNonDimmableSwitches.map(s => s.deviceId)
    ) || null;
    /* eslint-enable no-mixed-operators */

    const newCombinedRule = createCombinedRuleFromConfig(
      appKey,
      newDayRule,
      newNightRule,
      newIdleRule
    );

    const newRuleSummary = createRuleSummaryFromConfig(
      newConfig,
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

    // TODO: somewhere around here we could sync this against the exiting rulestore, to sync webapp side with the smartapp side
    //       the way things are now, changes to an app just steamroll the webapp side with a new config created from scratch
    // TODO: think rulesAreModified should really check both combined rule and transition rule
    if (await rulesAreModified(updateData.installedApp.installedAppId, newCombinedRule)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_unused, newCombinedRuleId, newTransitionRuleId] = await submitRulesForSmartAppOperation(
        new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN)),
        context.api.locations.locationId(),
        appKey,
        newCombinedRule,
        newTransitionRule,
        newRuleSummary
      );

      await storeRulesAndNotifyOperation(
        appKey,
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
