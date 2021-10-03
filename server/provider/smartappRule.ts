import FileContextStore from '@smartthings/file-context-store';
import { ContextStore, SmartApp } from '@smartthings/smartapp';
import JSONdb from 'simple-json-db';
import { IRuleSwitchLevelInfo, ISmartAppRuleConfig, ISmartAppRuleSwitchLevel, RuleStoreInfo } from '../types/index';
import process from './env';
import db from './db';
import createRuleFromConfig from '../operations/createRuleFromConfigOperation';
import createIdleRuleFromConfig from '../operations/createIdleRuleFromConfigOperation';
import submitRulesForSmartAppOperation from '../operations/submitRulesForSmartAppOperation';
import { RuleRequest } from '@smartthings/core-sdk';
import createTransitionRuleFromConfig from '../operations/createTransitionRuleFromConfigOperation';

const offset8AM = 60 * -4;
const offset8PM = 60 * 8;
const offset12AM = 60 * 12;
const defaultDayLevel = 50;
const defaultNightLevel = 15;

const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const ruleStore: JSONdb = new JSONdb(db.ruleStorePath, { asyncWrite: true });


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
	.page('rulesMainPage', async (context, page, configData) => {

		// prompts user to select a contact sensor
		page.section('types', section => {
			section.booleanSetting('switches')
			section.booleanSetting('locks')
			section.booleanSetting('motion')
			section.booleanSetting('rules')
		});

		page.section('sensors', section => {
			section
				.deviceSetting('motionSensor')
				.capabilities(['motionSensor'])
				.required(true)
		});

		page.section('switches', section => {
			section
				.deviceSetting('dayControlSwitch')
				.capabilities(['switch'])
				.required(true)
				.permissions('rx')
				.submitOnChange(true);

			section
				.deviceSetting('dayActiveSwitches')
				.capabilities(['switch'])
				.required(true)
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
				.required(true)
				.multiple(true)
				.permissions('rx')
				.submitOnChange(true);
		});

		page.section('timings', section => {
			// from 8AM
			section.numberSetting("dayStartOffset")
				.min(-720)
				.max(720)
				.step(15)
				.defaultValue(0)
				// @ts-ignore
				.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

			// from 8PM
			section.numberSetting("dayNightOffset")
				.min(-720)
				.max(720)
				.step(15)
				.defaultValue(0)
				// @ts-ignore
				.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

			// from 12A
			section.numberSetting("nightEndOffset")
				.min(-720)
				.max(720)
				.step(15)
				.defaultValue(0)
				.submitOnChange(true)
				// @ts-ignore
				.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

		});

		await page.section('levels', async section => {
			const allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
			const daySwitches = (await context.configDevices('dayControlSwitch')).concat(await context.configDevices('dayActiveSwitches'))
				.filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
			const nightSwitches = (await context.configDevices('nightControlSwitch')).concat(await context.configDevices('nightActiveSwitches'))
				.filter((s, i, self) => self.findIndex(c => c.deviceId === s.deviceId) === i);
			const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId ));
			const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceId ));

			dayDimmableSwitches.forEach(s => {
				section.numberSetting(`dayLevel${s.deviceId}`)
					.name(`${s.label} Day Dimming Level`)
					.min(10)
					.max(100)
					.step(5)
					.defaultValue(defaultDayLevel)
					// @ts-ignore
					.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
			});
			
			nightDimmableSwitches.forEach(s => {
				section.numberSetting(`nightLevel${s.deviceId}`)
					.name(`${s.label} Night Dimming Level`)
					.min(10)
					.max(100)
					.step(5)
					.defaultValue(defaultNightLevel)
					// @ts-ignore
					.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things
			});
		});
	})

	.updated(async (context, updateData) => {
		const appKey = `app-${updateData.installedApp.installedAppId}`;

		const newConfig: ISmartAppRuleConfig = context.config as unknown as ISmartAppRuleConfig;

		const allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
		const daySwitches = newConfig.dayControlSwitch.concat(newConfig.dayActiveSwitches) // next line filters out duplicate device ids between the 2 arrays
			.filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i);
		const nightSwitches = newConfig.nightControlSwitch.concat(newConfig.nightActiveSwitches) // next line filters out duplicate device ids between the 2 arrays
			.filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i);

		const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId ));
		const dayDimmableSwitchLevels = dayDimmableSwitches.map(s => { return { deviceId: s.deviceConfig.deviceId, switchLevel: parseInt(((newConfig[`dayLevel${s.deviceConfig.deviceId}`][0]) as ISmartAppRuleSwitchLevel).stringConfig.value) } as IRuleSwitchLevelInfo });
		const dayNonDimmableSwitches = daySwitches.filter(s => !dayDimmableSwitches.find(ss => s.deviceConfig.deviceId == ss.deviceConfig.deviceId));
		const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId ));
		const nightDimmableSwitchLevels = nightDimmableSwitches.map(s => { return { deviceId: s.deviceConfig.deviceId, switchLevel: parseInt(((newConfig[`nightLevel${s.deviceConfig.deviceId}`][0]) as ISmartAppRuleSwitchLevel).stringConfig.value) } as IRuleSwitchLevelInfo });
		const nightNonDimmableSwitches = nightSwitches.filter(s => !nightDimmableSwitches.find(ss => s.deviceConfig.deviceId == ss.deviceConfig.deviceId));

		const newDayRule = createRuleFromConfig(
			`${appKey}-daylight`,
			offset8AM + parseInt(newConfig.dayStartOffset[0].stringConfig.value),
			offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value),
			newConfig.motionSensor[0].deviceConfig.deviceId,
			newConfig.dayControlSwitch[0].deviceConfig.deviceId,
			dayDimmableSwitchLevels,
			dayNonDimmableSwitches.map(s => s.deviceConfig.deviceId),
		);

		const newNightRule = createRuleFromConfig(
			`${appKey}-nightlight`,
			offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value),
			offset12AM + parseInt(newConfig.nightEndOffset[0].stringConfig.value),
			newConfig.motionSensor[0].deviceConfig.deviceId,
			newConfig.nightControlSwitch[0].deviceConfig.deviceId,
			nightDimmableSwitchLevels,
			nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId)
		);

		const newIdleRule = createIdleRuleFromConfig(
			`${appKey}-idle`,
			newConfig.motionSensor[0].deviceConfig.deviceId,
			daySwitches.concat(nightSwitches).filter((s, i, self) => self.findIndex(c => c.deviceConfig.deviceId === s.deviceConfig.deviceId) === i).map(s => s.deviceConfig.deviceId),
			15
		);

		const newTransitionRule = createTransitionRuleFromConfig(
			`${appKey}-trans`,
			offset8PM + parseInt(newConfig.dayNightOffset[0].stringConfig.value),
			daySwitches.map(s => s.deviceConfig.deviceId),
			nightDimmableSwitchLevels,
			nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId)
		);

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
			console.log('Rules not modified, nothing to update');
		}
	})

	// // Configuration page definition
	// .page('mainPage', (_, page) => {

	// 	// prompts user to select a contact sensor
	// 	page.section('sensors', section => {
	// 		section
	// 			.deviceSetting('contactSensor')
	// 			.capabilities(['contactSensor'])
	// 			.required(true)
	// 	})

	// 	// prompts users to select one or more switch devices
	// 	page.section('lights', section => {
	// 		section
	// 			.deviceSetting('lights')
	// 			.capabilities(['switch'])
	// 			.required(true)
	// 			.multiple(true)
	// 			.permissions('rx')
	// 	})
	// })

	// // Handler called whenever app is installed or updated
	// // Called for both INSTALLED and UPDATED lifecycle events if there is
	// // no separate installed() handler
	// .updated(async (context) => {
	// 	await context.api.subscriptions.delete()
	// 	await context.api.subscriptions.subscribeToDevices(context.config.contactSensor,
	// 		'contactSensor', 'contact', 'openCloseHandler')
	// })

	// // Handler called when the configured open/close sensor opens or closes
	// .subscribedEventHandler('openCloseHandler', async (context, event) => {
	// 	const value = event.value === 'open' ? 'on' : 'off'
	// 	await context.api.devices.sendCommands(context.config.lights, 'switch', value)
	// })

const rulesAreModified = (ruleStoreKey: string, newDayRule: RuleRequest, newNightRule: RuleRequest, newIdleRule: RuleRequest, newTransitionRule: RuleRequest) => {
	const existingRules = ruleStore.get(ruleStoreKey) as RuleStoreInfo;
	return (!existingRules || 
		JSON.stringify(newDayRule) !== JSON.stringify(existingRules.dayLightRule) ||
		JSON.stringify(newNightRule) !== JSON.stringify(existingRules.nightLightRule) ||
		JSON.stringify(newIdleRule) !== JSON.stringify(existingRules.idleRule) ||
		JSON.stringify(newTransitionRule) !== JSON.stringify(existingRules.transitionRule))
};
