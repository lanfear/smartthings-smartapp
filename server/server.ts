import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({path: `./${fs.existsSync('./.env.local') ? '.env.local' : '.env'}`});
import {Device} from '@smartthings/core-sdk';
import express from 'express';
import cors from 'cors';
// import process from './provider/env';
import smartAppRule from './provider/smartAppRule';
import db from './provider/db';
import sse from './provider/sse';

const defaultPort = 3001;

const server = express();
const PORT = process.env.PORT || defaultPort;

server.use(cors()); // TODO: this could be improved
server.use(express.json());
// server.use(express.static(path.join(__dirname, '../public')));

/* Handle lifecycle event calls from SmartThings */
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