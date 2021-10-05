import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({path: `./${fs.existsSync('./.env.local') ? '.env.local' : '.env'}`});
import {SceneSummary, Device, Rule} from '@smartthings/core-sdk';
import express from 'express';
import cors from 'cors';
// import process from './provider/env';
import smartAppControl from './provider/smartappControl';
import smartAppRule from './provider/smartAppRule';
import db from './provider/db';
import sse from './provider/sse';
import {StatusCodes} from 'http-status-codes';

const defaultPort = 3001;

const server = express();
const PORT = process.env.PORT || defaultPort;

server.use(cors()); // TODO: this could be improved
server.use(express.json());
// server.use(express.static(path.join(__dirname, '../public')));

/* Handle lifecycle event calls from SmartThings */
server.post('/smartapp/control', (req, res) => {
  void smartAppControl.handleHttpCallback(req, res);
});

server.post('/smartapp/rule', (req, res) => {
  void smartAppRule.handleHttpCallback(req, res);
});

/**
 * list installed apps registered in the db
 */
server.get('/app', (_, res) => {
  const installedAppIds = db.listInstalledApps();
  res.send(installedAppIds);
});

/**
 * Render the installed app instance control page
 */
// would be neat to fix this, but appears handler for express cannot be async... but this functions as expected
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.get('/app/:id', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);

  const options: { installedAppId: string; scenes: SceneSummary[]; switches: Device[]; locks: Device[]; motion: Device[]; rules: Rule[] } = {
    installedAppId: req.params.id,
    scenes: [],
    switches: [],
    locks: [],
    motion: [],
    rules: []
  };

  if (context.configBooleanValue('scenes')) {
    options.scenes = await context.api.scenes?.list() || [];
  }

  if (context.configBooleanValue('switches')) {
    options.switches = await Promise.all((await context.api.devices?.list({capability: 'switch'}) || []).map(async (it: DeviceState) => {
      const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
      it.value = state.switch.value as string;
      return it;
    }));
  }

  if (context.configBooleanValue('locks')) {
    options.locks = await Promise.all((await context.api.devices?.list({capability: 'lock'}) || []).map(async (it: DeviceState) => {
      const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
      it.value = state.lock.value as string;
      return it;
    }));
  }

  if (context.configBooleanValue('motion')) {
    options.motion = await Promise.all((await context.api.devices?.list({capability: 'motionSensor'}) || []).map(async (it: DeviceState) => {
      const state = await context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
      it.value = state.motion.value as string;
      return it;
    }));
  }

  if (context.configBooleanValue('rules')) {
    options.rules = await Promise.all((await context.api.rules?.list() || []));
  }

  // res.render('isa', options)
  res.send(options);
});

/* Execute a scene */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/app/:id/scenes/:sceneId', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);
  const result = await context.api.scenes.execute(req.params.sceneId);
  res.send(result);
});

/* Execute a device command */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/app/:id/devices/:deviceId', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);
  const result = await context.api.devices.executeCommand(req.params.deviceId, req.body);
  res.send(result);
});


server.post('/app/:id/rule', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);
  const result = await context.api.rules.create(req.body);
  res.send(result);
});

server.delete('/app/:id/rule/:ruleId', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);
  await context.api.rules.delete(req.params.ruleId);
  res.statusCode = StatusCodes.NO_CONTENT;
  res.send();
});

/**
 * Handle SSE connection from the web page
 */
server.get('/events', sse.init);

/* Start listening at your defined PORT */
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is up and running at http://localhost:${PORT}`);
});

export type DeviceState = Device & { value: string };

export default server;