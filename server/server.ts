import fs from 'fs';
import path from 'path';
// eslint-disable-next-line import/order
import * as dotenv from 'dotenv';
// .env files live in server/, one level up from the compiled server/build/server.js
const serverDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(serverDir, '.env.local');
dotenv.config({path: fs.existsSync(envLocalPath) ? envLocalPath : path.join(serverDir, '.env'), quiet: true});
import type {Device, Command, RuleRequest} from '@smartthings/core-sdk';
import cors from 'cors';
import express, {type Request} from 'express';
import {StatusCodes} from 'http-status-codes';
import type {IResponseApps, IResponseLocation, IResponseMeasurements, IRule, IRuleComponentType, ISseRuleEvent} from 'types/sharedContracts';
import {isMeasurementType} from './constants/measurements';
import ReturnResultError from './exceptions/returnResultError';
import {generateRuleAppKey} from './factories/ruleFactory';
import {localOnlyMiddleware} from './middlewares';
import classifyRulesOperation from './operations/classifyRulesOperation';
import deleteRuleOperation from './operations/deleteRuleOperation';
import getWeatherOperation from './operations/getWeatherOperation';
import listActivityOperation from './operations/listActivityOperation';
import listMeasurementHistoryOperation from './operations/listMeasurementHistoryOperation';
import listMeasurementReadingsFromApiOperation from './operations/listMeasurementReadingsFromApiOperation';
import manageRuleApplicationOperation from './operations/manageRuleApplicationOperation';
import {startMeasurementRecording} from './operations/recordMeasurementsOperation';
import {cancelReEnableRuleTimers, reEnableRuleAfterDelay, restoreReEnableRuleTimers} from './operations/reEnableRuleAfterDelayOperation';
import reEnableStore from './provider/reEnableStore';
import ruleStore from './provider/ruleStore';
import sceneRoomStore from './provider/sceneRoomStore';
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
  const sceneRoomMap = await sceneRoomStore.get(req.params.id);
  const scenes = (await client.scenes.list({locationId: [req.params.id]})).map(s => ({...s, roomIds: sceneRoomMap[s.sceneId!] ?? []}));
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
  const installedApps = await client.installedApps.list({locationId: [req.params.id]});
  const storedRulesByApp = new Map(await Promise.all(installedApps.map(async a => [a.installedAppId, await ruleStore.get(a.installedAppId)] as const)));
  const smartThingsRules = await client.rules.list(req.params.id);
  // cross-reference rules against the installs, to spot stale duplicates / orphans (see IRuleHealthStatus)
  const {healthByRuleId, missingRuleIdsByApp} = classifyRulesOperation(smartThingsRules, installedApps, storedRulesByApp);
  // only installs with saved rule data are rule SmartApp installs - the control app and anything else is left out
  const reEnables = await reEnableStore.list();
  const apps: IResponseApps = installedApps.flatMap(a => {
    const stored = storedRulesByApp.get(a.installedAppId);
    const reEnableAt = Object.fromEntries(reEnables.filter(r => r.installedAppId === a.installedAppId).map(r => [r.ruleComponent, r.reEnableAt]));
    return stored ? [{...a, ruleSummary: stored.newRuleSummary, missingRuleIds: missingRuleIdsByApp.get(a.installedAppId) ?? [], reEnableAt: reEnableAt}] : [];
  });
  const rules = smartThingsRules.map(r => {
    const linkedInstalledApp = apps.find(a => a.ruleSummary.ruleIds.find(rid => rid === r.id));
    return {...r, dateCreated: new Date(r.dateCreated), dateUpdated: new Date(r.dateUpdated), ruleSummary: linkedInstalledApp?.ruleSummary, health: healthByRuleId.get(r.id)} as IRule;
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

/* Current readings of a measurement (temperature | humidity | battery) from every device in the location that reports it */
server.get('/location/:id/measurements/:measurement', async (req, res) => {
  const {id, measurement} = req.params;
  if (!isMeasurementType(measurement)) {
    res.status(StatusCodes.BAD_REQUEST).send(`Unknown measurement [${measurement}]`);
    return;
  }
  const response: IResponseMeasurements = {
    locationId: id,
    measurement: measurement,
    readings: await listMeasurementReadingsFromApiOperation(id, measurement)
  };
  res.json(response);
});

/**
 * Recorded history of a measurement, one series per device component (see operations/recordMeasurementsOperation.ts)
 * query: hours (default 24, max MEASUREMENT_RETENTION_DAYS), deviceIds (optional comma-separated list to restrict to),
 *        bucketMinutes (optional, average points into buckets of this size - keeps long ranges small)
 */
server.get('/location/:id/measurements/:measurement/history', async (req, res) => {
  const {id, measurement} = req.params;
  if (!isMeasurementType(measurement)) {
    res.status(StatusCodes.BAD_REQUEST).send(`Unknown measurement [${measurement}]`);
    return;
  }
  res.json(await listMeasurementHistoryOperation(id, measurement, {
    hours: Number(req.query.hours),
    deviceIds: typeof req.query.deviceIds === 'string' ? req.query.deviceIds.split(',').filter(Boolean) : [],
    bucketMinutes: Number(req.query.bucketMinutes)
  }));
});

/**
 * Outdoor weather from the SmartThings location service (current conditions + hourly forecast) and the outdoor
 * temperature the server has recorded from it (see operations/recordWeatherOperation.ts)
 * query: hours of recorded history (default 24, max MEASUREMENT_RETENTION_DAYS)
 */
server.get('/location/:id/weather', async (req, res) => {
  res.json(await getWeatherOperation(req.params.id, Number(req.query.hours)));
});

/**
 * Motion sensor and switch activity recorded from the control SmartApp's subscriptions, as on/active periods per device
 * query: hours (default 24, max MEASUREMENT_RETENTION_DAYS - activity shares the measurement retention)
 */
server.get('/location/:id/activity', async (req, res) => {
  res.json(await listActivityOperation(req.params.id, Number(req.query.hours)));
});

/* Execute a scene */
server.post('/location/:id/scenes/:sceneId', async (req, res) => {
  const result = await getSmartThingsClient().scenes.execute(req.params.sceneId);
  res.send(result);
});

/* Associate a scene with (zero or more of) our own rooms - SmartThings has no concept of this itself */
server.put('/location/:locationId/scenes/:sceneId/rooms', async (req: Request<{locationId: string; sceneId: string}>, res) => {
  await sceneRoomStore.setRoomsForScene(req.params.locationId, req.params.sceneId, (req.body as {roomIds: string[]}).roomIds);
  res.send();
});

/* Execute a device command */
server.post('/device/:deviceId', async (req, res) => {
  const result = await getSmartThingsClient().devices.executeCommand(req.params.deviceId, req.body as Command);
  res.send(result);
});

/* Enable/Disable a rule component */
server.put('/location/:locationId/rule/:installedAppId/:ruleComponent/:enabled', async (req: Request<{locationId: string; installedAppId: string; ruleComponent: IRuleComponentType | 'all'; enabled: string}>, res) => {
  // any explicit enable/disable supersedes a pending timed re-enable of the same rule component - otherwise an old timer
  // could later re-enable a rule that was since disabled on purpose
  const {locationId, installedAppId, ruleComponent} = req.params;
  await cancelReEnableRuleTimers(locationId, installedAppId, ruleComponent);

  // saved before the rules change, so the dashboards reloading on the resulting 'rule' event already see the resume time
  const reEnableDelay = (req.body as {reEnable?: number}).reEnable ?? 0;
  const hasReEnable = req.params.enabled === 'false' && reEnableDelay > 0;
  if (hasReEnable) {
    // eslint-disable-next-line no-console
    console.info('Starting re-enable timer from delay value of [', reEnableDelay, ']');
    await reEnableRuleAfterDelay(locationId, installedAppId, ruleComponent, reEnableDelay);
  }

  try {
    await manageRuleApplicationOperation(locationId, installedAppId, ruleComponent, req.params.enabled === 'false');
  } catch (e) {
    if (e instanceof ReturnResultError) {
      // eslint-disable-next-line no-console
      console.info('Early return from manageRuleApplicationOperation with status [', e.statusCode, '] message [', e.message, ']');
      if (hasReEnable && e.statusCode === Number(StatusCodes.NOT_MODIFIED)) {
        // already paused: keep the new resume time, and tell dashboards since no rule change will
        const stored = await ruleStore.get(installedAppId);
        if (stored) {
          const event: ISseRuleEvent = {appId: generateRuleAppKey(installedAppId), ruleSummary: stored.newRuleSummary};
          sse.send(JSON.stringify(event), 'rule');
        }
      } else if (hasReEnable) {
        // nothing was paused, so there's nothing to resume
        await cancelReEnableRuleTimers(locationId, installedAppId, ruleComponent);
      }
      res.statusCode = e.statusCode;
      res.statusMessage = e.message;
      res.send();
      return;
    }
    if (hasReEnable) {
      await cancelReEnableRuleTimers(locationId, installedAppId, ruleComponent);
    }
    throw e;
  }

  res.send();
});

server.post('/location/:id/rule', async (req, res) => {
  // someday we can do better than this, TS 4.17+ should support generic for Request type
  const result = await getSmartThingsClient().rules.create(req.body as RuleRequest);
  res.send(result);
});

server.delete('/location/:id/rule/:ruleId', async (req, res) => {
  await deleteRuleOperation(req.params.id, req.params.ruleId);
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
  startMeasurementRecording();
  restoreReEnableRuleTimers().catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Restoring pending timed re-enables failed', e);
  });
});

export type DeviceState = Device & {value: string};

export default server;
