"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sse_1 = __importDefault(require("../provider/sse"));
const sendSSEEvent = (data) => {
    sse_1.default.send(JSON.stringify(data), 'rule');
};
const storeRulesAndNotifyOperation = (ruleStore, smartAppLookupKey, combinedRule, combinbedRuleId, transitionRule, transitionRuleId, newRuleSummary) => {
    const newRuleInfo = {
        combinedRule: combinedRule,
        combinedRuleId: combinbedRuleId,
        transitionRule: transitionRule,
        transitionRuleId: transitionRuleId,
        newRuleSummary: newRuleSummary
    };
    ruleStore.set(smartAppLookupKey, newRuleInfo);
    sendSSEEvent({
        appId: smartAppLookupKey,
        ruleSummary: newRuleSummary
    });
};
exports.default = storeRulesAndNotifyOperation;
//# sourceMappingURL=storeRulesAndNotifyOperation.js.map