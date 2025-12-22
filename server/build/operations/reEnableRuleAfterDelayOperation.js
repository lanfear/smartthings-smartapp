"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reEnableRuleAfterDelay = void 0;
const manageRuleApplicationOperation_1 = __importDefault(require("./manageRuleApplicationOperation"));
// global cache of promises
const restartDelayTimers = {};
// for dev we use minutes, for live we use hours
const restartDelayBase = process.env.ENV_TYPE !== 'dev' ? 60 * 60 * 1000 : 60 * 1000;
const reEnableRuleAfterDelay = (locationId, installedAppId, ruleComponent, delayTimeout) => {
    const cacheKey = `${locationId}-${installedAppId}`;
    if (restartDelayTimers[cacheKey]) {
        clearTimeout(restartDelayTimers[cacheKey]);
    }
    setTimeout(() => {
        void (0, manageRuleApplicationOperation_1.default)(locationId, installedAppId, ruleComponent, false);
    }, restartDelayBase * delayTimeout);
};
exports.reEnableRuleAfterDelay = reEnableRuleAfterDelay;
//# sourceMappingURL=reEnableRuleAfterDelayOperation.js.map