"use strict";
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
exports.readDeviceLevelConfigFromContext = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const global_1 = __importDefault(require("../constants/global"));
dayjs_1.default.extend(customParseFormat_1.default);
dayjs_1.default.extend(utc_1.default);
const getDeviceConfigIfAuthenticated = (context, configId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!context.isAuthenticated()) {
        return null;
    }
    try {
        return yield context.configDevices(configId);
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.log('get config failed even though isAuthenticated', e);
        return null;
    }
});
const getMinuteOffsetFromNoon = (timeString) => {
    if (!timeString || timeString === '') {
        return 0;
    }
    const configDate = dayjs_1.default.utc(timeString, 'HH:mm A');
    // eslint-disable-next-line no-magic-numbers
    const noonDate = configDate.hour(12).minute(0).second(0).millisecond(0);
    return configDate.diff(noonDate, 'minute');
};
const readConfigFromContext = (context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return ({
        enableAllRules: (_a = context.configBooleanValue('enableAllRules')) === null || _a === void 0 ? void 0 : _a.valueOf(),
        enableDaylightRule: (_b = context.configBooleanValue('enableDaylightRule')) === null || _b === void 0 ? void 0 : _b.valueOf(),
        enableNightlightRule: (_c = context.configBooleanValue('enableNightlightRule')) === null || _c === void 0 ? void 0 : _c.valueOf(),
        enableIdleRule: (_d = context.configBooleanValue('enableIdleRule')) === null || _d === void 0 ? void 0 : _d.valueOf(),
        motionSensors: (_e = yield getDeviceConfigIfAuthenticated(context, 'motionSensor')) !== null && _e !== void 0 ? _e : [],
        motionMultipleAll: (_f = context.configBooleanValue('motionMultipleAll')) === null || _f === void 0 ? void 0 : _f.valueOf(),
        motionIdleTimeout: (_g = context.configNumberValue('motionIdleTimeout')) === null || _g === void 0 ? void 0 : _g.valueOf(),
        motionIdleTimeoutUnit: context.configBooleanValue('motionIdleTimeoutUnit') ? 'Minute' : 'Second',
        motionDurationDelay: (_h = context.configNumberValue('motionDurationDelay')) === null || _h === void 0 ? void 0 : _h.valueOf(),
        dayControlSwitch: ((_j = yield getDeviceConfigIfAuthenticated(context, 'dayControlSwitch')) !== null && _j !== void 0 ? _j : [null])[0],
        dayActiveSwitches: (_k = yield getDeviceConfigIfAuthenticated(context, 'dayActiveSwitches')) !== null && _k !== void 0 ? _k : [],
        nightControlSwitch: ((_l = yield getDeviceConfigIfAuthenticated(context, 'nightControlSwitch')) !== null && _l !== void 0 ? _l : [null])[0],
        nightActiveSwitches: (_m = yield getDeviceConfigIfAuthenticated(context, 'nightActiveSwitches')) !== null && _m !== void 0 ? _m : [],
        dayNightOffset: getMinuteOffsetFromNoon((_o = context.configTimeString('dayNightOffsetTime')) === null || _o === void 0 ? void 0 : _o.valueOf()),
        nightEndOffset: getMinuteOffsetFromNoon((_p = context.configTimeString('nightEndOffsetTime')) === null || _p === void 0 ? void 0 : _p.valueOf()),
        dayStartOffset: getMinuteOffsetFromNoon((_q = context.configTimeString('dayStartOffsetTime')) === null || _q === void 0 ? void 0 : _q.valueOf())
    });
});
const readDeviceLevelConfigFromContext = (context, devices) => devices.map(d => {
    var _a, _b;
    return ({
        deviceId: d.deviceId,
        switchDayLevel: (_a = context.configNumberValue(`dayLevel${d.deviceId}`)) !== null && _a !== void 0 ? _a : global_1.default.rule.default.switchDayLevel,
        switchNightLevel: (_b = context.configNumberValue(`nightLevel${d.deviceId}`)) !== null && _b !== void 0 ? _b : global_1.default.rule.default.switchNightLevel
    });
});
exports.readDeviceLevelConfigFromContext = readDeviceLevelConfigFromContext;
exports.default = readConfigFromContext;
//# sourceMappingURL=readConfigFromContext.js.map