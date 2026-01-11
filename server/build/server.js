"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: `./${fs_1.default.existsSync('./.env.local') ? '.env.local' : '.env'}` });
const core_sdk_1 = require("@smartthings/core-sdk");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = require("http-status-codes");
// import process from './provider/env';
const smartAppControl_1 = __importDefault(require("./provider/smartAppControl"));
const smartAppRule_1 = __importDefault(require("./provider/smartAppRule"));
const sse_1 = __importDefault(require("./provider/sse"));
const middlewares_1 = require("./middlewares");
const ruleStore_1 = __importDefault(require("./provider/ruleStore"));
const smartAppContextStore_1 = require("./provider/smartAppContextStore");
const manageRuleApplicationOperation_1 = __importDefault(require("./operations/manageRuleApplicationOperation"));
const returnResultError_1 = __importDefault(require("./exceptions/returnResultError"));
const reEnableRuleAfterDelayOperation_1 = require("./operations/reEnableRuleAfterDelayOperation");
const defaultPort = 3001;
const server = (0, express_1.default)();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : defaultPort;
// TODO: move this stuff to a config file
if (!process.env.CONTROL_APP_ID || !process.env.CONTROL_CLIENT_ID || !process.env.CONTROL_CLIENT_SECRET || !process.env.CONTROL_API_TOKEN) {
    throw new Error('CONTROL_APP_ID, CONTROL_CLIENT_ID, CONTROL_CLIENT_SECRET, and CONTROL_API_TOKEN environment variables are required but not all have been set.');
}
server.use((0, cors_1.default)()); // TODO: this could be improved
server.use(express_1.default.json());
// server.use(express.static(path.join(__dirname, '../public')));
/* Handle lifecycle event calls from SmartThings */
server.post('/smartapp/control', (req, res) => {
    void smartAppControl_1.default.handleHttpCallback(req, res);
});
server.post('/smartapp/rule', (req, res) => {
    void smartAppRule_1.default.handleHttpCallback(req, res);
});
server.use('/', middlewares_1.localOnlyMiddleware);
/**
 * list installed apps registered in the db
 */
server.get('/app', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const installedAppIds = yield (0, smartAppContextStore_1.listInstalledApps)();
    res.send(installedAppIds);
}));
server.get('/locations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    res.json(yield client.locations.list());
}));
server.get('/location/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    const rooms = yield client.rooms.list(req.params.id);
    const scenes = yield client.scenes.list({ locationId: [req.params.id] });
    const switches = yield Promise.all((yield client.devices.list({ locationId: [req.params.id], capability: 'switch' })).map((it) => __awaiter(void 0, void 0, void 0, function* () {
        const state = yield client.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
        it.value = state.switch.value;
        return it;
    })));
    const locks = yield Promise.all((yield client.devices.list({ locationId: [req.params.id], capability: 'lock' })).map((it) => __awaiter(void 0, void 0, void 0, function* () {
        const state = yield client.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
        it.value = state.lock.value;
        return it;
    })));
    const motion = yield Promise.all((yield client.devices.list({ locationId: [req.params.id], capability: 'motionSensor' })).map((it) => __awaiter(void 0, void 0, void 0, function* () {
        const state = yield client.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
        it.value = state.motion.value;
        return it;
    })));
    const apps = (yield Promise.all((yield client.installedApps.list({ locationId: [req.params.id] })).map((a) => __awaiter(void 0, void 0, void 0, function* () {
        const ruleStoreInfo = yield ruleStore_1.default.get(a.installedAppId);
        return Object.assign(Object.assign({}, a), { ruleSummary: ruleStoreInfo === null || ruleStoreInfo === void 0 ? void 0 : ruleStoreInfo.newRuleSummary });
    })))).filter(a => !!a.ruleSummary); // filter out apps that dont have mapped rule ids?  this _should_ be app ids that arent rule-apps (.env settings for RULE_APP_ID, but you may have multiple)
    const rules = (yield client.rules.list(req.params.id)).map(r => {
        const linkedInstalledApp = apps.find(a => a.ruleSummary.ruleIds.find(rid => rid === r.id));
        return Object.assign(Object.assign({}, r), { dateCreated: new Date(r.dateCreated), dateUpdated: new Date(r.dateUpdated), ruleSummary: linkedInstalledApp === null || linkedInstalledApp === void 0 ? void 0 : linkedInstalledApp.ruleSummary });
    });
    const response = {
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
}));
/* Execute a scene */
server.post('/location/:id/scenes/:sceneId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    const result = yield context.api.scenes.execute(req.params.sceneId);
    res.send(result);
}));
/* Execute a device command */
server.post('/device/:deviceId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    const result = yield client.devices.executeCommand(req.params.deviceId, req.body);
    res.send(result);
}));
/* Enable/Disable a rule component */
server.put('/location/:locationId/rule/:installedAppId/:ruleComponent/:enabled', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        yield (0, manageRuleApplicationOperation_1.default)(req.params.locationId, req.params.installedAppId, req.params.ruleComponent, req.params.enabled === 'false');
    }
    catch (e) {
        if (e instanceof returnResultError_1.default) {
            // eslint-disable-next-line no-console
            console.info('Early return from manageRuleApplicationOperation with status [', e.statusCode, '] message [', e.message, ']');
            res.statusCode = e.statusCode;
            res.statusMessage = e.message;
            res.send();
            return;
        }
        throw e;
    }
    const reEnableDelay = (_b = req.body.reEnable) !== null && _b !== void 0 ? _b : 0;
    if (req.params.enabled === 'false' && reEnableDelay > 0) {
        // eslint-disable-next-line no-console
        console.info('Starting re-enable timer from delay value of [', reEnableDelay, ']');
        (0, reEnableRuleAfterDelayOperation_1.reEnableRuleAfterDelay)(req.params.locationId, req.params.installedAppId, req.params.ruleComponent, reEnableDelay);
    }
    res.send();
}));
server.post('/location/:id/rule', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    // someday we can do better than this, TS 4.17+ should support generic for Request type
    const result = yield context.api.rules.create(req.body);
    res.send(result);
}));
server.delete('/location/:id/rule/:ruleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    yield client.rules.delete(req.params.ruleId, req.params.id);
    res.statusCode = http_status_codes_1.StatusCodes.NO_CONTENT;
    res.send();
}));
/**
 * Handle SSE connection from the web page
 */
server.get('/events', sse_1.default.init);
/* Start listening at your defined PORT */
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is up and running at http://localhost:${PORT}`);
});
exports.default = server;
//# sourceMappingURL=server.js.map