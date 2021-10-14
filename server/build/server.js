"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
/**
 * Render the installed app instance control page
 */
// would be neat to fix this, but appears handler for express cannot be async... but this functions as expected
// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.get('/app/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const context = yield smartAppControl_1.default.withContext(req.params.id);
    const options = {
        installedAppId: req.params.id,
        scenes: [],
        switches: [],
        locks: [],
        motion: [],
        rules: []
    };
    if (context.configBooleanValue('scenes')) {
        options.scenes = (yield ((_a = context.api.scenes) === null || _a === void 0 ? void 0 : _a.list())) || [];
    }
    if (context.configBooleanValue('switches')) {
        options.switches = yield Promise.all(((yield ((_b = context.api.devices) === null || _b === void 0 ? void 0 : _b.list({ capability: 'switch' }))) || []).map((it) => __awaiter(void 0, void 0, void 0, function* () {
            const state = yield context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'switch');
            it.value = state.switch.value;
            return it;
        })));
    }
    if (context.configBooleanValue('locks')) {
        options.locks = yield Promise.all(((yield ((_c = context.api.devices) === null || _c === void 0 ? void 0 : _c.list({ capability: 'lock' }))) || []).map((it) => __awaiter(void 0, void 0, void 0, function* () {
            const state = yield context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'lock');
            it.value = state.lock.value;
            return it;
        })));
    }
    if (context.configBooleanValue('motion')) {
        options.motion = yield Promise.all(((yield ((_d = context.api.devices) === null || _d === void 0 ? void 0 : _d.list({ capability: 'motionSensor' }))) || []).map((it) => __awaiter(void 0, void 0, void 0, function* () {
            const state = yield context.api.devices.getCapabilityStatus(it.deviceId, 'main', 'motionSensor');
            it.value = state.motion.value;
            return it;
        })));
    }
    if (context.configBooleanValue('rules')) {
        options.rules = yield Promise.all(((yield ((_e = context.api.rules) === null || _e === void 0 ? void 0 : _e.list())) || []));
    }
    // res.render('isa', options)
    res.send(options);
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
    const result = yield context.api.devices.executeCommand(req.params.deviceId, req.body);
    res.send(result);
}));
server.post('/app/:id/rule', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const context = yield smartAppControl_1.default.withContext(req.params.id);
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