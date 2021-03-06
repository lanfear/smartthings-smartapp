import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({path: `./${fs.existsSync('./.env.local') ? '.env.local' : '.env'}`});
import {SmartThingsClient, BearerTokenAuthenticator, Device, Command, RuleRequest} from '@smartthings/core-sdk';
import express, {Request} from 'express';
import cors from 'cors';
import {StatusCodes} from 'http-status-codes';
import JSONdb from 'simple-json-db';
import {RuleStoreInfo} from './types';
import {IResponseLocation, IRuleComponentType} from 'sharedContracts';
// import process from './provider/env';
import smartAppControl from './provider/smartAppControl';
import smartAppRule from './provider/smartAppRule';
import db from './provider/db';
import sse from './provider/sse';
import {localOnlyMiddleware} from './middlewares';
import {createCombinedRuleFromSummary, createTransitionRuleFromSummary} from './operations/createRuleFromSummaryOperation';
import submitRulesForSmartAppOperation from './operations/submitRulesForSmartAppOperation';

const defaultPort = 3001;

const server = express();
const PORT = process.env.PORT || defaultPort;
const ruleStore: JSONdb = new JSONdb(db.ruleStorePath, {asyncWrite: true});

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
server.get('/app', (_, res) => {
  const installedAppIds = db.listInstalledApps();
  res.send(installedAppIds);
});

server.get('/locations', async (req, res) => {
  const client = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
  res.json(await client.locations.list() || []);
});

server.get('/location/:id', async (req, res) => {
  const client = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));

  const rooms = await client.rooms?.list(req.params.id) || [];
  const scenes = await client.scenes?.list({locationId: [req.params.id]}) || [];
  const switches = await Promise.all((await client.devices?.list({locationId: [req.params.id], capability: 'switch'}) || []).map(async (it: DeviceState) => {
    const state = await client.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
    it.value = state.switch.value as string;
    return it;
  }));
  const locks = await Promise.all((await client.devices?.list({locationId: [req.params.id], capability: 'lock'}) || []).map(async (it: DeviceState) => {
    const state = await client.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
    it.value = state.lock.value as string;
    return it;
  }));
  const motion = await Promise.all((await client.devices?.list({locationId: [req.params.id], capability: 'motionSensor'}) || []).map(async (it: DeviceState) => {
    const state = await client.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
    it.value = state.motion.value as string;
    return it;
  }));
  const apps = (await client.installedApps?.list({locationId: [req.params.id]}) || []).map(a => {
    const ruleStoreInfo = ruleStore.get(`app-${a.installedAppId}`) as RuleStoreInfo;
    return {...a, ruleSummary: ruleStoreInfo?.newRuleSummary};
  });
  const rules = (await client.rules?.list(req.params.id) || []).map(r => {
    const linkedInstalledApp = apps.find(a => a.ruleSummary?.ruleIds.find(rid => rid === r.id));
    return {...r, ruleSummary: linkedInstalledApp?.ruleSummary};
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
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/location/:id/scenes/:sceneId', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);
  const result = await context.api.scenes.execute(req.params.sceneId);
  res.send(result);
});

/* Execute a device command */
server.post('/device/:deviceId', async (req, res) => {
  const client = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
  const result = await client.devices.executeCommand(req.params.deviceId, req.body as Command);
  res.send(result);
});

/* Enable/Disable a rule component */
server.put('/location/:locationId/rule/:installedAppId/:ruleComponent/:enabled', async (req: Request<{locationId: string; installedAppId: string; ruleComponent: IRuleComponentType | 'all'; enabled: string}>, res) => {
  const appKey = `app-${req.params.installedAppId}`;
  const ruleStoreInfo = ruleStore.get(appKey) as RuleStoreInfo;

  if (!ruleStoreInfo) {
    res.statusCode = 422;
    res.statusMessage = `No rule stored in database for appId [${req.params.installedAppId}]`;
    res.send();
    return;
  }

  // if route passed 'all' we disable all rule components, else, we disable whichever matches
  ruleStoreInfo.newRuleSummary.temporaryDisableAllRules = req.params.ruleComponent === 'all' && req.params.enabled === 'false'; // may want to factor this disable all value into the following rules?
  ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule = req.params.ruleComponent === 'daylight' ? req.params.enabled === 'false' : !ruleStoreInfo.newRuleSummary.enableDaylightRule && ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule;
  ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule = req.params.ruleComponent === 'nightlight' ? req.params.enabled === 'false' : !ruleStoreInfo.newRuleSummary.enableNightlightRule && ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule;
  ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule = req.params.ruleComponent === 'idle' ? req.params.enabled === 'false' : !ruleStoreInfo.newRuleSummary.enableIdleRule && ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule;
  ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule = req.params.ruleComponent === 'transition' ? req.params.enabled === 'false' : !ruleStoreInfo.newRuleSummary.enableTransitionRule && ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule;
  const combinedRule = createCombinedRuleFromSummary(
    ruleStoreInfo.newRuleSummary
  );
  const transitionRule = createTransitionRuleFromSummary(
    ruleStoreInfo.newRuleSummary
  );

  // eslint-disable-next-line no-console
  // console.log(req.params.ruleComponent, req.params.enabled, ruleStoreInfo.newRuleSummary);

  const rulesAreModified =
    JSON.stringify(combinedRule) !== JSON.stringify(ruleStoreInfo.combinedRule) ||
    JSON.stringify(transitionRule) !== JSON.stringify(ruleStoreInfo.transitionRule);

  if (!rulesAreModified) {
    // eslint-disable-next-line no-console
    console.log('Rules not modified, nothing to update');
    res.statusCode = StatusCodes.NOT_MODIFIED;
    res.send();
    return;
  }

  const client = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
  await submitRulesForSmartAppOperation(
    client,
    ruleStore,
    req.params.locationId,
    appKey,
    combinedRule,
    transitionRule,
    ruleStoreInfo.newRuleSummary
  );

  res.send();
});

server.post('/location/:id/rule', async (req, res) => {
  const context = await smartAppControl.withContext(req.params.id);
  // someday we can do better than this, TS 4.17+ should support generic for Request type
  const result = await context.api.rules.create(req.body as RuleRequest);
  res.send(result);
});

server.delete('/location/:id/rule/:ruleId', async (req, res) => {
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