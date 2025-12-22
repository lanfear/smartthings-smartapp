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
const core_sdk_1 = require("@smartthings/core-sdk");
const http_status_codes_1 = require("http-status-codes");
const json_diff_ts_1 = require("json-diff-ts");
const ruleStore_1 = __importDefault(require("../provider/ruleStore"));
const returnResultError_1 = __importDefault(require("../exceptions/returnResultError"));
const createRuleFromSummaryOperation_1 = require("./createRuleFromSummaryOperation");
const submitRulesForSmartAppOperation_1 = __importDefault(require("./submitRulesForSmartAppOperation"));
const storeRulesAndNotifyOperation_1 = __importDefault(require("./storeRulesAndNotifyOperation"));
const determineTempDisableValue = (matchingRuleComponent, targetRuleComponent, coreRuleIsEnabled, existingValue, newValue) => ((targetRuleComponent !== matchingRuleComponent && targetRuleComponent !== 'all') || !coreRuleIsEnabled) ? existingValue : newValue;
const configureRule = (locationId, installedAppId, ruleComponent, ruleDisabled) => __awaiter(void 0, void 0, void 0, function* () {
    const appKey = `app-${installedAppId}`;
    const ruleStoreInfo = yield ruleStore_1.default.get(installedAppId);
    const ruleStoreInfoOrig = JSON.parse(JSON.stringify(ruleStoreInfo));
    // eslint-disable-next-line no-console
    // console.log('configuring delete for [', ruleComponent, '] from source values -> paramsDisabled [', paramsDisabled, '] ruleIsEnabled [', ruleIsEnabled, '] disableRule [', disableRule, ']');
    if (!ruleStoreInfo) {
        throw new returnResultError_1.default(`No rule stored in database for appId [${installedAppId}]`, http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY);
    }
    ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule = determineTempDisableValue('daylight', ruleComponent, ruleStoreInfo.newRuleSummary.enableDaylightRule, ruleStoreInfo.newRuleSummary.temporaryDisableDaylightRule, ruleDisabled);
    ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule = determineTempDisableValue('nightlight', ruleComponent, ruleStoreInfo.newRuleSummary.enableNightlightRule, ruleStoreInfo.newRuleSummary.temporaryDisableNightlightRule, ruleDisabled);
    ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule = determineTempDisableValue('idle', ruleComponent, ruleStoreInfo.newRuleSummary.enableIdleRule, ruleStoreInfo.newRuleSummary.temporaryDisableIdleRule, ruleDisabled);
    ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule = determineTempDisableValue('transition', ruleComponent, ruleStoreInfo.newRuleSummary.enableTransitionRule, ruleStoreInfo.newRuleSummary.temporaryDisableTransitionRule, ruleDisabled);
    // do not write these to ruleStoreInfo actual objects because we do not want to actually write temporarily modified rule info there, we want to preserve the native app configured rules
    const combinedRule = (0, createRuleFromSummaryOperation_1.createCombinedRuleFromSummary)(ruleStoreInfo.newRuleSummary);
    const transitionRule = (0, createRuleFromSummaryOperation_1.createTransitionRuleFromSummary)(ruleStoreInfo.newRuleSummary);
    // this compare should work 100%, but brought in the diff pkg during debugging and using it for now
    // if (JSON.stringify(ruleStoreInfo) === JSON.stringify(ruleStoreInfoOrig)) {
    if ((0, json_diff_ts_1.diff)(ruleStoreInfo, ruleStoreInfoOrig).length === 0) { // diff returns empty array if no differences
        throw new returnResultError_1.default('Rules not modified, nothing to update', http_status_codes_1.StatusCodes.NOT_MODIFIED);
    }
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    const [newRuleSummary, newCombinedRuleId, newTransitionRuleId] = yield (0, submitRulesForSmartAppOperation_1.default)(client, locationId, appKey, combinedRule, transitionRule, ruleStoreInfo.newRuleSummary);
    yield (0, storeRulesAndNotifyOperation_1.default)(installedAppId, ruleStoreInfo.combinedRule, newCombinedRuleId, ruleStoreInfo.transitionRule, newTransitionRuleId, newRuleSummary);
});
exports.default = configureRule;
//# sourceMappingURL=manageRuleApplicationOperation.js.map