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
/* eslint-disable no-mixed-operators */
const sse_1 = __importDefault(require("../provider/sse"));
const core_sdk_1 = require("@smartthings/core-sdk");
const sendSSEEvent = (data) => {
    sse_1.default.send(JSON.stringify(data), 'rule');
};
const submitRules = (api, ruleStore, smartAppLookupKey, combinedRule, transitionRule, newRuleSummary) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    /* eslint-disable no-console */
    console.log('Submitting Rules');
    console.log('Rule', JSON.stringify(combinedRule));
    /* eslint-enable no-console */
    const client = new core_sdk_1.SmartThingsClient(new core_sdk_1.BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN));
    const locationId = api.locations.locationId();
    // TODO: after all existing rules are cleared, this can go
    yield Promise.all(((yield ((_a = api.rules) === null || _a === void 0 ? void 0 : _a.list())) || [])
        .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
        .map((r) => __awaiter(void 0, void 0, void 0, function* () { return yield api.rules.delete(r.id); })));
    yield Promise.all(((yield ((_b = client.rules) === null || _b === void 0 ? void 0 : _b.list(locationId))) || [])
        .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
        .map((r) => __awaiter(void 0, void 0, void 0, function* () { return yield api.rules.delete(r.id, locationId); })));
    const newCombinedRuleResponse = combinedRule && (yield client.rules.create(combinedRule, locationId)) || null;
    const newTransitionRuleResponse = transitionRule && (yield client.rules.create(transitionRule, locationId)) || null;
    const newRuleIds = [newCombinedRuleResponse === null || newCombinedRuleResponse === void 0 ? void 0 : newCombinedRuleResponse.id, newTransitionRuleResponse === null || newTransitionRuleResponse === void 0 ? void 0 : newTransitionRuleResponse.id].filter(id => !!id);
    newRuleSummary.ruleIds.push(...newRuleIds);
    const newRuleInfo = {
        combinedRule: combinedRule,
        combinedRuleId: newCombinedRuleResponse === null || newCombinedRuleResponse === void 0 ? void 0 : newCombinedRuleResponse.id,
        transitionRule: transitionRule,
        transitionRuleId: newTransitionRuleResponse === null || newTransitionRuleResponse === void 0 ? void 0 : newTransitionRuleResponse.id,
        newRuleSummary: newRuleSummary
    };
    // eslint-disable-next-line no-console
    console.log('Applied Rules', yield api.rules.list());
    ruleStore.set(smartAppLookupKey, newRuleInfo);
    sendSSEEvent({
        appId: smartAppLookupKey,
        ruleSummary: newRuleSummary
    });
});
exports.default = submitRules;
//# sourceMappingURL=submitRulesForSmartAppOperation.js.map