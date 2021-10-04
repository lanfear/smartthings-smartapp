import FileContextStore from '@smartthings/file-context-store';
import {SmartApp} from '@smartthings/smartapp';
import process from './env';
import db from './db';
import sse from './sse';

/*
 * Persistent storage of SmartApp tokens and configuration data in local files
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
const contextStore: any = new FileContextStore(db.dataDirectory);

/* Define the SmartApp */
export default new SmartApp()
    .enableEventLogging()
    .configureI18n()
    .permissions(['r:devices:*', 'x:devices:*', 'r:scenes:*', 'x:scenes:*', 'r:rules:*', 'w:rules:*'])
    .appId(process.env.CONTROL_APP_ID)
    .clientId(process.env.CONTROL_CLIENT_ID)
    .clientSecret(process.env.CONTROL_CLIENT_SECRET)
    .contextStore(contextStore)

// Configuration page definition
    .page('mainPage', (context, page, configData) => {
        // prompts user to select a contact sensor
        page.section('types', section => {
            section.booleanSetting('scenes');
            section.booleanSetting('switches');
            section.booleanSetting('locks');
            section.booleanSetting('motion');
            section.booleanSetting('rules');
        });
    })

// Handler called whenever app is installed or updated
// Called for both INSTALLED and UPDATED lifecycle events if there is
// no separate installed() handler
    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete();
        if (context.configBooleanValue('switches')) {
            await context.api.subscriptions.subscribeToCapability('switch', 'switch', 'switchHandler');
        }
        if (context.configBooleanValue('locks')) {
            await context.api.subscriptions.subscribeToCapability('lock', 'lock', 'lockHandler');
        }
        if (context.configBooleanValue('motionSensor')) {
            await context.api.subscriptions.subscribeToCapability('motionSensor', 'motionSensor', 'motionSensorHandler');
        }
    })

// Handler called when the status of a switch changes
    .subscribedEventHandler('switchHandler', (__context, event) => {
        if (event.componentId === 'main') {
            sse.send(JSON.stringify({
                deviceId: event.deviceId,
                value: event.value
            }));
        }
    })

// Handler called when the status of a lock changes
    .subscribedEventHandler('lockHandler', (__context, event) => {
        if (event.componentId === 'main') {
            sse.send(JSON.stringify({
                deviceId: event.deviceId,
                value: event.value
            }));
        }
    })

// Handler called when the status of a lock changes
    .subscribedEventHandler('motionSensorHandler', (__context, event) => {
        if (event.componentId === 'main') {
            sse.send(JSON.stringify({
                deviceId: event.deviceId,
                value: event.value
            }));
        }
    });
	
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
