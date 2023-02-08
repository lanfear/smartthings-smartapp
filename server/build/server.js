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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: `./${fs_1.default.existsSync('./.env.local') ? '.env.local' : '.env'}` });
const core_sdk_1 = require("@smartthings/core-sdk");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = require("http-status-codes");
const simple_json_db_1 = __importDefault(require("simple-json-db"));
// import process from './provider/env';
const smartAppControl_1 = __importDefault(require("./provider/smartAppControl"));
const smartAppRule_1 = __importDefault(require("./provider/smartAppRule"));
const db_1 = __importDefault(require("./provider/db"));
const sse_1 = __importDefault(require("./provider/sse"));
const middlewares_1 = require("./middlewares");
const createRuleFromSummaryOperation_1 = require("./operations/createRuleFromSummaryOperation");
const submitRulesForSmartAppOperation_1 = __importDefault(require("./operations/submitRulesForSmartAppOperation"));
const defaultPort = 3001;
const server = (0, express_1.default)();
const PORT = process.env.PORT || defaultPort;
const ruleStore = new simple_json_db_1.default(db_1.default.ruleStorePath, { asyncWrite: true });
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
server.get('/app', (_, res) => {
    const installedAppIds = db_1.default.listInstalledApps();
    res.send(installedAppIds);
});
server.get('/locations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    res.json((yield client.locations.list()) || []);
}));
server.get('/location/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    const rooms = (yield ((_a = client.rooms) === null || _a === void 0 ? void 0 : _a.list(req.params.id))) || [];
    const scenes = (yield ((_b = client.scenes) === null || _b === void 0 ? void 0 : _b.list({ locationId: [req.params.id] }))) || [];
    const switches = yield Promise.all(((yield ((_c = client.devices) === null || _c === void 0 ? void 0 : _c.list({ locationId: [req.params.id], capability: 'switch' }))) || []).map((it) => __awaiter(void 0, void 0, void 0, function* () {
        const state = yield client.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
        it.value = state.switch.value;
        return it;
    })));
    const locks = yield Promise.all(((yield ((_d = client.devices) === null || _d === void 0 ? void 0 : _d.list({ locationId: [req.params.id], capability: 'lock' }))) || []).map((it) => __awaiter(void 0, void 0, void 0, function* () {
        const state = yield client.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
        it.value = state.lock.value;
        return it;
    })));
    const motion = yield Promise.all(((yield ((_e = client.devices) === null || _e === void 0 ? void 0 : _e.list({ locationId: [req.params.id], capability: 'motionSensor' }))) || []).map((it) => __awaiter(void 0, void 0, void 0, function* () {
        const state = yield client.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
        it.value = state.motion.value;
        return it;
    })));
    const apps = ((yield ((_f = client.installedApps) === null || _f === void 0 ? void 0 : _f.list({ locationId: [req.params.id] }))) || []).map(a => {
        const ruleStoreInfo = ruleStore.get(`app-${a.installedAppId}`);
        return Object.assign(Object.assign({}, a), { ruleSummary: ruleStoreInfo === null || ruleStoreInfo === void 0 ? void 0 : ruleStoreInfo.newRuleSummary });
    });
    const rules = ((yield ((_g = client.rules) === null || _g === void 0 ? void 0 : _g.list(req.params.id))) || []).map(r => {
        const linkedInstalledApp = apps.find(a => { var _a; return (_a = a.ruleSummary) === null || _a === void 0 ? void 0 : _a.ruleIds.find(rid => rid === r.id); });
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
// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
    const appKey = `app-${req.params.installedAppId}`;
    const ruleStoreInfo = ruleStore.get(appKey);
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
    const combinedRule = (0, createRuleFromSummaryOperation_1.createCombinedRuleFromSummary)(ruleStoreInfo.newRuleSummary);
    const transitionRule = (0, createRuleFromSummaryOperation_1.createTransitionRuleFromSummary)(ruleStoreInfo.newRuleSummary);
    // eslint-disable-next-line no-console
    // console.log(req.params.ruleComponent, req.params.enabled, ruleStoreInfo.newRuleSummary);
    const rulesAreModified = JSON.stringify(combinedRule) !== JSON.stringify(ruleStoreInfo.combinedRule) ||
        JSON.stringify(transitionRule) !== JSON.stringify(ruleStoreInfo.transitionRule);
    if (!rulesAreModified) {
        // eslint-disable-next-line no-console
        console.log('Rules not modified, nothing to update');
        res.statusCode = http_status_codes_1.StatusCodes.NOT_MODIFIED;
        res.send();
        return;
    }
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    yield (0, submitRulesForSmartAppOperation_1.default)(client, ruleStore, req.params.locationId, appKey, combinedRule, transitionRule, ruleStoreInfo.newRuleSummary);
    res.send();
}));
server.post('/location/:id/rule', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    // someday we can do better than this, TS 4.17+ should support generic for Request type
    const result = yield context.api.rules.create(req.body);
    res.send(result);
}));
server.delete('/location/:id/rule/:ruleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    yield context.api.rules.delete(req.params.ruleId);
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