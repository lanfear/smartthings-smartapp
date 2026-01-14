import fs from 'fs';
// eslint-disable-next-line import/order
import * as dotenv from 'dotenv';
dotenv.config({path: `./${fs.existsSync('./.env.local') ? '.env.local' : '.env'}`});
import type {Device, Command, RuleRequest} from '@smartthings/core-sdk';
import cors from 'cors';
import express, {type Request} from 'express';
import {StatusCodes} from 'http-status-codes';
import type {IResponseApps, IResponseLocation, IRule, IRuleComponentType} from 'types/sharedContracts';
import ReturnResultError from './exceptions/returnResultError';
import {localOnlyMiddleware} from './middlewares';
import manageRuleApplicationOperation from './operations/manageRuleApplicationOperation';
import {reEnableRuleAfterDelay} from './operations/reEnableRuleAfterDelayOperation';
import ruleStore from './provider/ruleStore';
import settings from './provider/settings';
import {listInstalledApps} from './provider/smartAppContextStore';
import smartAppControl from './provider/smartAppControl';
import smartAppRule from './provider/smartAppRule';
import getSmartThingsClient from './provider/smartThingsClient';
import sse from './provider/sse';

const server = express();

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

server.use('/', localOnlyMiddleware);
/**
 * list installed apps registered in the db
 */
server.get('/app', async (_, res) => {
  const installedAppIds = await listInstalledApps();
  res.send(installedAppIds);
});

server.get('/locations', async (req, res) => {
  res.json(await getSmartThingsClient().locations.list());
});

server.get('/location/:id', async (req, res) => {
  const client = getSmartThingsClient();
  const rooms = await client.rooms.list(req.params.id);
  const scenes = await client.scenes.list({locationId: [req.params.id]});
  const switches = await Promise.all((await client.devices.list({locationId: [req.params.id], capability: 'switch'})).map(async it => {
    const state = await client.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
    (it as DeviceState).value = state.switch.value as string;
    return it as DeviceState;
  }));
  const locks = await Promise.all((await client.devices.list({locationId: [req.params.id], capability: 'lock'})).map(async it => {
    const state = await client.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
    (it as DeviceState).value = state.lock.value as string;
    return it as DeviceState;
  }));
  const motion = await Promise.all((await client.devices.list({locationId: [req.params.id], capability: 'motionSensor'})).map(async it => {
    const state = await client.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
    (it as DeviceState).value = state.motion.value as string;
    return it as DeviceState;
  }));
  const apps = (await Promise.all((await client.installedApps.list({locationId: [req.params.id]})).map(async a => {
    const ruleStoreInfo = await ruleStore.get(a.installedAppId);
    return {...a, ruleSummary: ruleStoreInfo?.newRuleSummary};
  }))).filter(a => !!a.ruleSummary) as IResponseApps; // filter out apps that dont have mapped rule ids?  this _should_ be app ids that arent rule-apps (.env settings for RULE_APP_ID, but you may have multiple)
  const rules = (await client.rules.list(req.params.id)).map(r => {
    const linkedInstalledApp = apps.find(a => a.ruleSummary.ruleIds.find(rid => rid === r.id));
    return {...r, dateCreated: new Date(r.dateCreated), dateUpdated: new Date(r.dateUpdated), ruleSummary: linkedInstalledApp?.ruleSummary} as IRule;
  });

  const response: IResponseLocation = {
    locationId: req.params.id,
    rooms: rooms,
    scenes: scenes,
    switches: switches,
    locks: locks,
    motion: motion,
    rules: rules,
    apps: apps
  };

  res.json(response);
});

/* Execute a scene */

server.post('/location/:id/scenes/:sceneId', async (req, res) => {
  const result = await getSmartThingsClient().scenes.execute(req.params.sceneId);
  res.send(result);
});

/* Execute a device command */
server.post('/device/:deviceId', async (req, res) => {
  const result = await getSmartThingsClient().devices.executeCommand(req.params.deviceId, req.body as Command);
  res.send(result);
});

/* Enable/Disable a rule component */
server.put('/location/:locationId/rule/:installedAppId/:ruleComponent/:enabled', async (req: Request<{locationId: string; installedAppId: string; ruleComponent: IRuleComponentType | 'all'; enabled: string}>, res) => {
  try {
    await manageRuleApplicationOperation(req.params.locationId, req.params.installedAppId, req.params.ruleComponent, req.params.enabled === 'false');
  } catch (e) {
    if (e instanceof ReturnResultError) {
      // eslint-disable-next-line no-console
      console.info('Early return from manageRuleApplicationOperation with status [', e.statusCode, '] message [', e.message, ']');
      res.statusCode = e.statusCode;
      res.statusMessage = e.message;
      res.send();
      return;
    }
    throw e;
  }

  const reEnableDelay = (req.body as {reEnable?: number}).reEnable ?? 0;
  if (req.params.enabled === 'false' && reEnableDelay > 0) {
    // eslint-disable-next-line no-console
    console.info('Starting re-enable timer from delay value of [', reEnableDelay, ']');
    reEnableRuleAfterDelay(
      req.params.locationId,
      req.params.installedAppId,
      req.params.ruleComponent,
      reEnableDelay
    );
  }

  res.send();
});

server.post('/location/:id/rule', async (req, res) => {
  // someday we can do better than this, TS 4.17+ should support generic for Request type
  const result = await getSmartThingsClient().rules.create(req.body as RuleRequest);
  res.send(result);
});

server.delete('/location/:id/rule/:ruleId', async (req, res) => {
  await getSmartThingsClient().rules.delete(req.params.ruleId, req.params.id);
  res.statusCode = StatusCodes.NO_CONTENT;
  res.send();
});

/**
 * Handle SSE connection from the web page
 */
server.get('/events', sse.init);

/* Start listening at your defined PORT */
server.listen(settings.hostPort, settings.hostName, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is up and running at http://${settings.hostName}:${settings.hostPort}`);
});

export type DeviceState = Device & {value: string};

export default server;
