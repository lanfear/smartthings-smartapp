"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_context_store_1 = __importDefault(require("@smartthings/file-context-store"));
const smartapp_1 = require("@smartthings/smartapp");
const db_1 = __importDefault(require("./db"));
const sse_1 = __importDefault(require("./sse"));
/*
 * Persistent storage of SmartApp tokens and configuration data in local files
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
const contextStore = new file_context_store_1.default(db_1.default.dataDirectory);
/* Define the SmartApp */
exports.default = new smartapp_1.SmartApp()
    .enableEventLogging()
    .configureI18n()
    .permissions(['r:devices:*', 'x:devices:*', 'r:scenes:*', 'x:scenes:*', 'r:rules:*', 'w:rules:*'])
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
    .updated((context) => __awaiter(void 0, void 0, void 0, function* () {
    yield context.api.subscriptions.delete();
    if (context.configBooleanValue('switches')) {
        yield context.api.subscriptions.subscribeToCapability('switch', 'switch', 'switchHandler');
    }
    if (context.configBooleanValue('locks')) {
        yield context.api.subscriptions.subscribeToCapability('lock', 'lock', 'lockHandler');
    }
    if (context.configBooleanValue('motionSensor')) {
        yield context.api.subscriptions.subscribeToCapability('motionSensor', 'motionSensor', 'motionSensorHandler');
    }
}))
    // Handler called when the status of a switch changes
    .subscribedEventHandler('switchHandler', (__context, event) => {
    if (event.componentId === 'main') {
        sse_1.default.send(JSON.stringify({
            deviceId: event.deviceId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            value: event.value
        }));
    }
})
    // Handler called when the status of a lock changes
    .subscribedEventHandler('lockHandler', (__context, event) => {
    if (event.componentId === 'main') {
        sse_1.default.send(JSON.stringify({
            deviceId: event.deviceId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            value: event.value
        }));
    }
})
    // Handler called when the status of a lock changes
    .subscribedEventHandler('motionSensorHandler', (__context, event) => {
    if (event.componentId === 'main') {
        sse_1.default.send(JSON.stringify({
            deviceId: event.deviceId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            value: event.value
        }));
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
//# sourceMappingURL=smartappControl.js.map