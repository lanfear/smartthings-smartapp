import FileContextStore from '@smartthings/file-context-store';
import { ContextStore, SmartApp } from '@smartthings/smartapp';
import { RuleRequest } from "@smartthings/core-sdk";
import { ISmartAppRuleConfig } from '../types/index';
import process from './env';
import db from './db';
import sse from './sse';
import JSONdb from 'simple-json-db';
import { generateConditionBetween, generateConditionMotion, generateActionSwitchLevel, generateConditionDeviceOff, generateActionSwitchOn } from '../factories/ruleFactory';

const offset8AM = 60 * -4;
const offset8PM = 60 * 8;

/*
 * Persistent storage of SmartApp tokens and configuration data in local files
 */
const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const ruleStore: JSONdb = new JSONdb(db.ruleStorePath, { asyncWrite: true });

const createRuleFromConfig = ( 
	ruleLabel: string,
	dayStartOffset: number,
	dayNightOffset: number,
	nightEndOffset: number,
	motionControlDeviceId: string,
	dayControlDeviceId: string,
	dayActiveSwitchLevelDeviceIds: string[],
	dayActiveSwitchOnDeviceIds: string[],
	nightControlDeviceId: string,
	nightActiveSwitchLevelDeviceIds: string[],
	nightActiveSwitchOnDeviceIds: string[]
	) => {
		const dayBetweenCondition = generateConditionBetween(offset8AM + dayStartOffset, offset8PM + dayNightOffset);
		const nightBetweenCondition = generateConditionBetween(offset8PM + dayNightOffset, nightEndOffset);
		const motionCondition = generateConditionMotion(motionControlDeviceId);
		const dayControlSwitchCondition = generateConditionDeviceOff(dayControlDeviceId);
		const nightControlSwitchCondition = generateConditionDeviceOff(nightControlDeviceId);
		const daySwitchDimmableActions = dayActiveSwitchLevelDeviceIds.map( s => {
			return generateActionSwitchLevel(s, 50);
		});
		const daySwitchOnActions = dayActiveSwitchOnDeviceIds.map( s => {
			return generateActionSwitchOn(s);
		});
		const nightSwitchDimmableActions = nightActiveSwitchLevelDeviceIds.map( s => {
			return generateActionSwitchLevel(s, 15);
		});
		const nightSwitchOnActions = nightActiveSwitchOnDeviceIds.map( s => {
			return generateActionSwitchOn(s);
		});

		const newRule: RuleRequest = {
			name: `Motion ${ruleLabel}`,
			actions: [
				{
					if: {
						and: [
							dayBetweenCondition, 
							motionCondition,
							dayControlSwitchCondition
						],
						then: daySwitchDimmableActions.concat(daySwitchOnActions)
					}
				},
				{
					if: {
						and: [
							nightBetweenCondition, 
							motionCondition,
							nightControlSwitchCondition
						],
						then: nightSwitchDimmableActions.concat(nightSwitchOnActions)
					}
				}
			]
		};

		return newRule;

} 

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
	.page('rulesMainPage', (context, page, configData) => {

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
				.permissions('rx');

			section
				.deviceSetting('dayActiveSwitches')
				.capabilities(['switch'])
				.required(true)
				.multiple(true)
				.permissions('rx');

			section
				.deviceSetting('nightControlSwitch')
				.capabilities(['switch'])
				.required(true)
				.permissions('rx');

			section
				.deviceSetting('nightActiveSwitches')
				.capabilities(['switch'])
				.required(true)
				.multiple(true)
				.permissions('rx');
		});

		page.section('timings', section => {
			// from 8AM
			section.numberSetting("dayStartOffset")
				.min(-720)
				.max(720)
				.step(15)
				// @ts-ignore
				.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

			// from 8PM
			section.numberSetting("dayNightOffset")
				.min(-720)
				.max(720)
				.step(15)
				// @ts-ignore
				.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

			// from 12A
			section.numberSetting("nightEndOffset")
				.min(-720)
				.max(720)
				.step(15)
				// @ts-ignore
				.style('SLIDER'); //NumberStyle.SLIDER translates to undefined because typescript things

		});
	})

	.updated(async (context, updateData) => {
		const appKey = `app-${updateData.installedApp.installedAppId}`;
		const existingRuleInfo: RuleStoreInfo = ruleStore.get(appKey) as RuleStoreInfo;
		console.log('existing store data', existingRuleInfo);
		if (existingRuleInfo && existingRuleInfo.mainRuleId) {
			console.log('deleting existing rules', existingRuleInfo.mainRuleId);
			await Promise.all((await context.api.rules.list()).map(async r => await context.api.rules.delete(r.id)));
			//await context.api.rules.delete(existingRuleInfo.mainRuleId);
		}

		//await Promise.all((await context.api.devices?.list({capability: 'switch'}) || [])
		//await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');

		const newConfig: ISmartAppRuleConfig = context.config as unknown as ISmartAppRuleConfig;

		const allDimmableSwitches = await Promise.all(await context.api.devices?.list({capability: 'switchLevel'}) || []);
		const daySwitches = newConfig.dayControlSwitch.concat(newConfig.dayActiveSwitches);
		const nightSwitches = newConfig.nightControlSwitch.concat(newConfig.nightActiveSwitches);

		const dayDimmableSwitches = daySwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId ));
		const dayNonDimmableSwitches = daySwitches.filter(s => !dayDimmableSwitches.find(ss => s.deviceConfig.deviceId == ss.deviceConfig.deviceId));
		const nightDimmableSwitches = nightSwitches.filter(s => allDimmableSwitches.find(ss => ss.deviceId === s.deviceConfig.deviceId ));
		const nightNonDimmableSwitches = nightSwitches.filter(s => !nightDimmableSwitches.find(ss => s.deviceConfig.deviceId == ss.deviceConfig.deviceId));

		console.log('config stuff', dayDimmableSwitches, dayNonDimmableSwitches, nightDimmableSwitches, nightNonDimmableSwitches)

		const newRule = createRuleFromConfig(
			'Family Room Rule',
			parseInt(newConfig.dayStartOffset[0].stringConfig.value),
			parseInt(newConfig.dayNightOffset[0].stringConfig.value),
			parseInt(newConfig.nightEndOffset[0].stringConfig.value),
			newConfig.motionSensor[0].deviceConfig.deviceId,
			newConfig.dayControlSwitch[0].deviceConfig.deviceId,
			dayDimmableSwitches.map(s => s.deviceConfig.deviceId),
			dayNonDimmableSwitches.map(s => s.deviceConfig.deviceId),
			newConfig.nightControlSwitch[0].deviceConfig.deviceId,
			nightDimmableSwitches.map(s => s.deviceConfig.deviceId),
			nightNonDimmableSwitches.map(s => s.deviceConfig.deviceId)
		)

		console.log('new rule', newRule);

		const newRuleInfo: RuleStoreInfo = {};
		const newRuleResponse = await context.api.rules.create(newRule);
		newRuleInfo.mainRuleId = newRuleResponse.id;
		ruleStore.set(appKey, newRuleInfo);

		console.log('rules', await context.api.rules.list());
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


interface RuleStoreInfo {
	mainRuleId?: string
}