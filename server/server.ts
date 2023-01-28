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
import storeRulesAndNotifyOperation from './operations/storeRulesAndNotifyOperation';

const defaultPort = 3001;

const server = express();
const PORT = process.env.PORT || defaultPort;
const ruleStore = new JSONdb<RuleStoreInfo>(db.ruleStorePath, {asyncWrite: true});

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
    const ruleStoreInfo = ruleStore.get(`app-${a.installedAppId}`);
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
server.put('/location/:locationId/rule/:installedAppId/:ruleComponent/:enabled', async (req: Request<{ locationId: string; installedAppId: string; ruleComponent: IRuleComponentType | 'all'; enabled: string }>, res) => {
  const determineTempDisableValue = (ruleComponent: string, ruleComponentParam: string, paramsDisabled: boolean, ruleIsEnabled: boolean, ruleIsTemporarilyDisabled: boolean, allRulesAreTemporarilyDisabled: boolean): boolean => {
    // if our route is configuring a different rule, just base decision on the value of the allTempDisabled, which is already set
    // console.log('allinfo', 'ruleComponent', ruleComponent, 'ruleComponentParam', ruleComponentParam, 'paramsDisabled', paramsDisabled, 'ruleIsEnabled', ruleIsEnabled, 'ruleIsTemporarilyDisabled', ruleIsTemporarilyDisabled, 'allRulesAreTemporarilyDisabled', allRulesAreTemporarilyDisabled);
    if (ruleComponent !== ruleComponentParam) {
      // console.log('comp', ruleComponent, 'param', ruleComponentParam, 'route doesnt match, setting to alldisabled || current value of tempDisabled', allRulesAreTemporarilyDisabled, ruleIsTemporarilyDisabled, '===>', allRulesAreTemporarilyDisabled || ruleIsTemporarilyDisabled);
      return allRulesAreTemporarilyDisabled || ruleIsTemporarilyDisabled;
    }

    // console.log('comp', ruleComponent, 'param', ruleComponentParam, 'route does match, setting to !ruleIsEnabled ? false : paramsDisabled', 're', ruleIsEnabled, 'pe', paramsDisabled, '===>', !ruleIsEnabled ? false : paramsDisabled);
    return !ruleIsEnabled ? false : paramsDisabled;
  };

  const appKey = `app-${req.params.installedAppId}`;
  const ruleStoreInfo = ruleStore.get(appKey);
  const ruleStoreInfoOrig = JSON.parse(JSON.stringify(ruleStoreInfo)) as RuleStoreInfo;

  if (!ruleStoreInfo) {
    res.statusCode = 422;
    res.statusMessage = `No rule stored in database for appId [${req.params.installedAppId}]`;
    res.send();
    return;
  }

  ruleStoreInfo.newRuleSummary.temporaryDisableAllRules = req.params.ruleComponent === 'all' ? req.params.enabled === 'false' : ruleStoreInfo.newRuleSummary.temporaryDisableAllRules; // may want to factor this disable all value into the following rules?
  ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule = determineTempDisableValue('daylight', req.params.ruleComponent, req.params.enabled === 'false', ruleStoreInfo.newRuleSummary.enableDaylightRule, ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule, ruleStoreInfo.newRuleSummary.temporaryDisableAllRules);
  ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule = determineTempDisableValue('nightlight', req.params.ruleComponent, req.params.enabled === 'false', ruleStoreInfo.newRuleSummary.enableNightlightRule, ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule, ruleStoreInfo.newRuleSummary.temporaryDisableAllRules);
  ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule = determineTempDisableValue('idle', req.params.ruleComponent, req.params.enabled === 'false', ruleStoreInfo.newRuleSummary.enableIdleRule, ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule, ruleStoreInfo.newRuleSummary.temporaryDisableAllRules);
  ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule = determineTempDisableValue('transition', req.params.ruleComponent, req.params.enabled === 'false', ruleStoreInfo.newRuleSummary.enableTransitionRule, ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule, ruleStoreInfo.newRuleSummary.temporaryDisableAllRules);
  ruleStoreInfo.combinedRule = createCombinedRuleFromSummary(
    ruleStoreInfo.newRuleSummary
  );
  ruleStoreInfo.transitionRule = createTransitionRuleFromSummary(
    ruleStoreInfo.newRuleSummary
  );

  // bet on jsonify ordreing matching across saves...
  if (JSON.stringify(ruleStoreInfo) === JSON.stringify(ruleStoreInfoOrig)) {
    // eslint-disable-next-line no-console
    console.log('Rules not modified, nothing to update');
    res.statusCode = StatusCodes.NOT_MODIFIED;
    res.send();
    return;
  }

  const client = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
  const [newRuleSummary, newCombinedRuleId, newTransitionRuleId] = await submitRulesForSmartAppOperation(
    client,
    req.params.locationId,
    appKey,
    ruleStoreInfo.combinedRule,
    ruleStoreInfo.transitionRule,
    ruleStoreInfo.newRuleSummary
  );

  storeRulesAndNotifyOperation(
    ruleStore,
    appKey,
    ruleStoreInfo.combinedRule,
    newCombinedRuleId,
    ruleStoreInfo.transitionRule,
    newTransitionRuleId,
    newRuleSummary
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
