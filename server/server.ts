// eslint-disable-next-line
import { SceneSummary, Device, Rule } from '@smartthings/core-sdk';
import express from 'express';
import cors from 'cors';
import path from 'path';
import process from './provider/env';
import smartApp from './provider/smartapp';
import db from './provider/db';
import sse from './provider/sse';
//require('dotenv').config();
const server = express();
const PORT = process.env.PORT || 3001;

server.use(cors()); // TODO: this could be improved
server.use(express.json());
// server.use(express.static(path.join(__dirname, '../public')));

/* Handle lifecycle event calls from SmartThings */
server.post('/smartapp', (req, res) => {
    void smartApp.handleHttpCallback(req, res);
});

/**
 * list installed apps registered in the db
 */
server.get('/app', (_, res) => {
    const installedAppIds = db.listInstalledApps()
    res.send(installedAppIds);
})

/**
 * Render the installed app instance control page
 */
// would be neat to fix this, but appears handler for express cannot be async... but this functions as expected
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.get('/app/:id', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)

    const options:{ installedAppId: string, scenes: SceneSummary[], switches: Device[], locks: Device[], motion: Device[], rules: Rule[] } = {
        installedAppId: req.params.id,
        scenes: [],
        switches: [],
        locks: [],
        motion: [],
        rules: []
    }

    if (context.configBooleanValue('scenes')) {
        // @ts-ignore
        options.scenes = await context.api.scenes?.list() || [];
    }

    if (context.configBooleanValue('switches')) {
        // @ts-ignore
        options.switches = await Promise.all((await context.api.devices?.list({capability: 'switch'}) || []).map(async it => {
            // @ts-ignore
            const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
            return {
                deviceId: it.deviceId,
                label: it.label,
                value: state.switch.value
            };
        }))
    }

    if (context.configBooleanValue('locks')) {
        // @ts-ignore
        options.locks = await Promise.all((await context.api.devices?.list({capability: 'lock'}) || []).map(async it => {
            // @ts-ignore
            const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
            return {
                deviceId: it.deviceId,
                label: it.label,
                value: state.lock.value
            };
        }))
    }

    if (context.configBooleanValue('motion')) {
        // @ts-ignore
        options.motion = await Promise.all((await context.api.devices?.list({capability: 'motionSensor'}) || []).map(async it => {
            // @ts-ignore
            const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
            return {
                deviceId: it.deviceId,
                label: it.label,
                value: state.motion.value
            };
        }))
    }

    if (context.configBooleanValue('rules')) {
        options.rules = await Promise.all((await context.api.rules?.list() || []).map(async it => {
            return it;
        }));
    }

    //res.render('isa', options)
    res.send(options);
})

/* Execute a scene */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/app/:id/scenes/:sceneId', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)
    const result = await context.api.scenes.execute(req.params.sceneId)
    res.send(result)
});

/* Execute a device command */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/app/:id/devices/:deviceId', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)
    const result = await context.api.devices.executeCommand(req.params.deviceId, req.body)
    res.send(result)
});


server.put('/app/:id/rule/add', async(req, res) => {
    const testRule = {
        name: "If motion is detected, turn on a light",
        actions: [
            {
                if: {
                    equals: {
                        left: {
                            device: {
                                devices: [
                                    process.env.RULE_MOTION_DEVICEID
                                ],
                                component: "main",
                                capability: "motionSensor",
                                attribute: "motion"
                            }
                        },
                        right: {
                            string: "active"
                        }
                    },
                    then: [
                        {
                            command: {
                                devices: [
                                    process.env.RULE_SWITCH_DEVICEID
                                ],
                                commands: [
                                    {
                                        component: "main",
                                        capability: "switchLevel",
                                        command: "setLevel",
                                        arguments: [{ "integer": 33 }, { "integer": 20 }]
                                    },
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    };

    const context = await smartApp.withContext(req.params.id);
    const result = await context.api.rules.create(testRule);
    res.send(result);
});

server.delete('/app/:id/rule/:ruleId', async(req, res) => {
    const context = await smartApp.withContext(req.params.id);
    const result = await context.api.rules.delete(req.params.ruleId);
    res.statusCode = 204; //no content
    res.send();
});

/**
 * Handle SSE connection from the web page
 */
server.get('/events', sse.init);

/* Start listening at your defined PORT */
server.listen(PORT, () => {
    console.log(`Server is up and running at http://localhost:${PORT}`)
});

export default server;