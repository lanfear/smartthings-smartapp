// eslint-disable-next-line
import { SceneSummary, Device, Rule } from '@smartthings/core-sdk';
import express from 'express';
import path from 'path';
import process from './provider/env';
import smartApp from './provider/smartapp';
import db from './provider/db';
import sse from './provider/sse';
//require('dotenv').config();
const server = express();
const PORT = process.env.PORT || 3001;

server.use(express.json());
// server.use(express.static(path.join(__dirname, '../public')));
// server.set('views', path.join(__dirname, '../views'))
// server.set('view engine', 'ejs')

/* Handle lifecycle event calls from SmartThings */
server.post('/smartapp', (req, res) => {
    void smartApp.handleHttpCallback(req, res);
});

/**
 * Render the home page listing installed app instances
 */
server.get('/', (req, res) => {
    const installedAppIds = db.listInstalledApps()
    res.render('index', {installedAppIds})
})

/**
 * Render the installed app instance control page
 */
// would be neat to fix this, but appears handler for express cannot be async... but this functions as expected
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.get('/isa/:id', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)

    const options:{ installedAppId: string, scenes: SceneSummary[], switches: Device[], locks: Device[] } = {
        installedAppId: req.params.id,
        scenes: [],
        switches: [],
        locks: []
    }

    if (context.configBooleanValue('scenes')) {
        // @ts-ignore
        options.scenes = await context.api.scenes.list()
    }

    if (context.configBooleanValue('switches')) {
        // @ts-ignore
        options.switches = await Promise.all((await context.api.devices.list({capability: 'switch'})).map(async it => {
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
        options.locks = await Promise.all((await context.api.devices.list({capability: 'lock'})).map(async it => {
            // @ts-ignore
            const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
            return {
                deviceId: it.deviceId,
                label: it.label,
                value: state.lock.value
            };
        }))
    }

    //res.render('isa', options)
    res.send(options);
})

/* Execute a scene */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/isa/:id/scenes/:sceneId', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)
    const result = await context.api.scenes.execute(req.params.sceneId)
    res.send(result)
});

/* Execute a device command */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/isa/:id/devices/:deviceId', async (req, res) => {
    const context = await smartApp.withContext(req.params.id)
    const result = await context.api.devices.executeCommand(req.params.deviceId, req.body)
    res.send(result)
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