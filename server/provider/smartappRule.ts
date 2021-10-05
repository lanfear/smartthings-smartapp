import FileContextStore from '@smartthings/file-context-store';
import {ContextStore, SmartApp} from '@smartthings/smartapp';
import {Device, IntervalUnit, RuleRequest} from '@smartthings/core-sdk';
import JSONdb from 'simple-json-db';
import {IRuleSwitchLevelInfo, ISmartAppRuleConfig, ISmartAppRuleSwitch, ISmartAppRuleSwitchLevel, RuleStoreInfo} from '../types/index';
import process from './env';
import db from './db';
import createTriggerRuleFromConfig from '../operations/createTriggerRuleFromConfigOperation';
import createIdleRuleFromConfig from '../operations/createIdleRuleFromConfigOperation';
import submitRulesForSmartAppOperation from '../operations/submitRulesForSmartAppOperation';
import createTransitionRuleFromConfig from '../operations/createTransitionRuleFromConfigOperation';

/* eslint-disable no-magic-numbers */
const offset8AM = 60 * -4;
const offset8PM = 60 * 8;
const offset6Hours = 360;
const offset12Hours = 720;
const defaultDayLevel = 50;
const defaultNightLevel = 15;
const increment5 = 5;
const increment15 = 15;
/* eslint-enable no-magic-numbers */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const ruleStore: JSONdb = new JSONdb(db.ruleStorePath, {asyncWrite: true});

const rulesAreModified = (ruleStoreKey: string, newDayRule: RuleRequest, newNightRule: RuleRequest, newIdleRule: RuleRequest, newTransitionRule: RuleRequest): boolean => {
  const existingRules = ruleStore.get(ruleStoreKey) as RuleStoreInfo;
  return (!existingRules ||
        JSON.stringify(newDayRule) !== JSON.stringify(existingRules.dayLightRule) ||
        JSON.stringify(newNightRule) !== JSON.stringify(existingRules.nightLightRule) ||
        JSON.stringify(newIdleRule) !== JSON.stringify(existingRules.idleRule) ||
        JSON.stringify(newTransitionRule) !== JSON.stringify(existingRules.transitionRule));
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
    // prompts user to select a contact sensor
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
      section.numberSetting('dayStartOffset')
        .min(-offset12Hours)
        .max(offset12Hours)
        .step(increment15)
        .defaultValue(0);
      // slider would be nice, but UI provides no numerical feedback, so worthless =\
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

      // from 8PM
      section.numberSetting('dayNightOffset')
        .min(-offset12Hours)
        .max(offset12Hours)
        .step(increment15)
        .defaultValue(0);
      // slider would be nice, but UI provides no numerical feedback, so worthless =\
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

      // from 8AM
      section.numberSetting('nightEndOffset')
        .min(-offset12Hours)
        .max(offset12Hours)
        .step(increment15)
        .defaultValue(0);
      // slider would be nice, but UI provides no numerical feedback, so worthless =\
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
    });

    // i know this does something, even though apparently the typedefs say otherwise
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await page.section('levels', async section => {
      section.hideable(true);
      try {
        const allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
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
            .defaultValue(defaultDayLevel);
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
            .defaultValue(defaultNightLevel);
          // slider would be nice, but UI provides no numerical feedback, so worthless =\
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // .style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
        });
      } catch {
        // this happens on app installation, you have not authorized any scopes yet, so the api calls implicit above will fail
      }
    });
  })

  .updated(async (context, updateData) => {
    const appKey = `app-${updateData.installedApp.installedAppId}`;

    const newConfig: ISmartAppRuleConfig = context.config as unknown as ISmartAppRuleConfig;

    let allDimmableSwitches: Device[];
    let daySwitches: ISmartAppRuleSwitch[];
    let nightSwitches: ISmartAppRuleSwitch[];
    try {
      allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
      daySwitches = (newConfig.dayControlSwitch ?? []).concat(newConfig.dayActiveSwitches ?? []) // next line filters out duplicate device ids between the 2 arrays
        .filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i);
      nightSwitches = (newConfig.nightControlSwitch ?? []).concat(newConfig.nightActiveSwitches ?? []) // next line filters out duplicate device ids between the 2 arrays
        .filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i);
    } catch {
      // this also happens before you have authorized scopes in the app during initial installation
      return;
    }

    const getSwitchLevel = (s: ISmartAppRuleSwitch, configPrefix: string, defaultLevel: number): number => {
      if (!newConfig[`dayLevel${s.deviceConfig.deviceId}`]) {
        return defaultLevel;
      }
      return parseInt(((newConfig[`${configPrefix}${s.deviceConfig.deviceId}`][0]) as ISmartAppRuleSwitchLevel).stringConfig.value, 10);
    };
    const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId));
    const dayDimmableSwitchLevels = dayDimmableSwitches.map(s => ({deviceId: s.deviceConfig.deviceId, switchLevel: getSwitchLevel(s, 'dayLevel', defaultDayLevel)} as IRuleSwitchLevelInfo));
    const dayNonDimmableSwitches = daySwitches.filter(s => !dayDimmableSwitches.find(ss => s.deviceConfig.deviceId === ss.deviceConfig.deviceId));
    const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId));
    const nightDimmableSwitchLevels = nightDimmableSwitches.map(s => ({deviceId: s.deviceConfig.deviceId, switchLevel: getSwitchLevel(s, 'nightLevel', defaultNightLevel)} as IRuleSwitchLevelInfo));
    const nightNonDimmableSwitches = nightSwitches.filter(s => !nightDimmableSwitches.find(ss => s.deviceConfig.deviceId === ss.deviceConfig.deviceId));

    const dayRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule');
    const nightRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableNightlightRule');
    const idleRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableIdleRule');
    const transitionRuleEnabled = context.configBooleanValue('enableAllRules') && context.configBooleanValue('enableDaylightRule') && context.configBooleanValue('enableNightlightRule');

    /* eslint-disable no-mixed-operators */
    const newDayRule = dayRuleEnabled && createTriggerRuleFromConfig(
      `${appKey}-daylight`,
      offset8AM + parseInt(newConfig.dayStartOffset[0].stringConfig.value, 10),
      offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value, 10),
      newConfig.motionSensor.map(m => m.deviceConfig.deviceId),
      newConfig.dayControlSwitch[0].deviceConfig.deviceId,
      dayDimmableSwitchLevels,
      dayNonDimmableSwitches.map(s => s.deviceConfig.deviceId),
      context.configBooleanValue('motionMultipleAll'),
      parseInt(newConfig.motionDurationDelay[0].stringConfig.value, 10)
    ) || null;

    const newNightRule = nightRuleEnabled && createTriggerRuleFromConfig(
      `${appKey}-nightlight`,
      offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value, 10),
      offset8AM + parseInt(newConfig.nightEndOffset[0].stringConfig.value, 10),
      newConfig.motionSensor.map(m => m.deviceConfig.deviceId),
      newConfig.nightControlSwitch[0].deviceConfig.deviceId,
      nightDimmableSwitchLevels,
      nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId),
      context.configBooleanValue('motionMultipleAll'),
      parseInt(newConfig.motionDurationDelay[0].stringConfig.value, 10)
    ) || null;

    const newIdleRule = idleRuleEnabled && createIdleRuleFromConfig(
      `${appKey}-idle`,
      newConfig.motionSensor.map(m => m.deviceConfig.deviceId),
      daySwitches.concat(nightSwitches).filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i).map(s => s.deviceConfig.deviceId),
      parseInt(newConfig.motionIdleTimeout[0].stringConfig.value, 10),
      context.configBooleanValue('motionIdleTimeoutUnit') ? IntervalUnit.Minute : IntervalUnit.Second,
      !context.configBooleanValue('motionMultipleAll') // you invert this setting for the idle case
    ) || null;

    const newTransitionRule = transitionRuleEnabled && createTransitionRuleFromConfig(
      `${appKey}-trans`,
      offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value, 10),
      daySwitches.map(s => s.deviceConfig.deviceId),
      nightDimmableSwitchLevels,
      nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId)
    ) || null;
    /* eslint-enable no-mixed-operators */

    if (rulesAreModified(appKey, newDayRule, newNightRule, newIdleRule, newTransitionRule)) {
      await submitRulesForSmartAppOperation(
        context.api,
        ruleStore,
        appKey,
        newDayRule,
        newNightRule,
        newIdleRule,
        newTransitionRule
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('Rules not modified, nothing to update');
    }
  });
