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
// import process from './provider/env';
const smartAppControl_1 = __importDefault(require("./provider/smartAppControl"));
const smartAppRule_1 = __importDefault(require("./provider/smartAppRule"));
const db_1 = __importDefault(require("./provider/db"));
const sse_1 = __importDefault(require("./provider/sse"));
const http_status_codes_1 = require("http-status-codes");
const defaultPort = 3001;
const server = (0, express_1.default)();
const PORT = process.env.PORT || defaultPort;
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
    const rules = (yield ((_f = client.rules) === null || _f === void 0 ? void 0 : _f.list(req.params.id))) || [];
    const apps = (yield ((_g = client.installedApps) === null || _g === void 0 ? void 0 : _g.list({ locationId: [req.params.id] }))) || [];
    res.json({
        rooms,
        scenes,
        switches,
        locks,
        motion,
        rules,
        apps
    });
}));
/* Execute a scene */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/app/:id/scenes/:sceneId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    const result = yield context.api.scenes.execute(req.params.sceneId);
    res.send(result);
}));
/* Execute a device command */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.post('/app/:id/devices/:deviceId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    // someday we can do better than this, TS 4.17+ should support generic for Request type
    const result = yield context.api.devices.executeCommand(req.params.deviceId, req.body);
    res.send(result);
}));
server.post('/app/:id/rule', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    // someday we can do better than this, TS 4.17+ should support generic for Request type
    const result = yield context.api.rules.create(req.body);
    res.send(result);
}));
server.delete('/app/:id/rule/:ruleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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