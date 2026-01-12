import {SmartApp, type ContextStore} from '@smartthings/smartapp';
import type {ISseEventType, ISseEvent} from 'types/sharedContracts';
import smartAppContextStore from './smartAppContextStore';
import sse from './sse';

/*
 * Persistent storage of SmartApp tokens and configuration data in local files
 */

if (!process.env.CONTROL_APP_ID || !process.env.CONTROL_CLIENT_ID || !process.env.CONTROL_CLIENT_SECRET) {
  throw new Error('CONTROL_APP_ID, CONTROL_CLIENT_ID, and CONTROL_CLIENT_SECRET environment variables are required but not all have been set.');
}

// const contextStore: ContextStore = new FileContextStore(db.dataDirectory);
const contextStore: ContextStore = smartAppContextStore(process.env.CONTROL_APP_ID);

const sendSSEEvent = (type: ISseEventType, data: ISseEvent): void => {
  sse.send(JSON.stringify(data), type);
};

/* Define the SmartApp */
export default new SmartApp()
  .enableEventLogging(2, process.env.LOGGING_EVENTS_ENABLED?.toLowerCase() === 'true')
  .configureI18n()
  .permissions(['r:locations:*', 'r:devices:*', 'x:devices:*', 'r:scenes:*', 'x:scenes:*', 'r:rules:*', 'w:rules:*'])
  .appId(process.env.CONTROL_APP_ID)
  .clientId(process.env.CONTROL_CLIENT_ID)
  .clientSecret(process.env.CONTROL_CLIENT_SECRET)
  .contextStore(contextStore)

  .page('mainPage', (_, page) => {
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
  .updated(async context => {
    await context.api.subscriptions.delete();
    if (context.configBooleanValue('switches')) {
      await context.api.subscriptions.subscribeToCapability('switch', 'switch', 'switchHandler');
    }
    if (context.configBooleanValue('locks')) {
      await context.api.subscriptions.subscribeToCapability('lock', 'lock', 'lockHandler');
    }
    if (context.configBooleanValue('motion')) {
      await context.api.subscriptions.subscribeToCapability('motionSensor', 'motion', 'motionSensorHandler');
    }
  })

// Handler called when the status of a switch changes
  .subscribedEventHandler('switchHandler', (__context, event) => {
    if (event.componentId === 'main') {
      sendSSEEvent('switch', {
        deviceId: event.deviceId,
        value: event.value as string
      });
    }
  })

// Handler called when the status of a lock changes
  .subscribedEventHandler('lockHandler', (__context, event) => {
    if (event.componentId === 'main') {
      sendSSEEvent('lock', {
        deviceId: event.deviceId,
        value: event.value as string
      });
    }
  })

// Handler called when the status of a lock changes
  .subscribedEventHandler('motionSensorHandler', (__context, event) => {
    if (event.componentId === 'main') {
      sendSSEEvent('motion', {
        deviceId: event.deviceId,
        value: event.value as string
      });
    }
  });

// // Configuration page definition
// .page('mainPage', (_, page) => {

//     // prompts user to select a contact sensor
//     page.section('sensors', section => {
//         section
//             .deviceSetting('contactSensor')
//             .capabilities(['contactSensor'])
//             .required(true)
//     })

//     // prompts users to select one or more switch devices
//     page.section('lights', section => {
//         section
//             .deviceSetting('lights')
//             .capabilities(['switch'])
//             .required(true)
//             .multiple(true)
//             .permissions('rx')
//     })
// })

// // Handler called whenever app is installed or updated
// // Called for both INSTALLED and UPDATED lifecycle events if there is
// // no separate installed() handler
// .updated(async (context) => {
//     await context.api.subscriptions.delete()
//     await context.api.subscriptions.subscribeToDevices(context.config.contactSensor,
//         'contactSensor', 'contact', 'openCloseHandler')
// })

// // Handler called when the configured open/close sensor opens or closes
// .subscribedEventHandler('openCloseHandler', async (context, event) => {
//     const value = event.value === 'open' ? 'on' : 'off'
//     await context.api.devices.sendCommands(context.config.lights, 'switch', value)
// })
