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
Object.defineProperty(exports, "__esModule", { value: true });
const submitRules = (client, locationId, smartAppLookupKey, combinedRule, transitionRule, newRuleSummary) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    /* eslint-disable no-console */
    console.log('Submitting Rules', locationId);
    console.log('Main Rule', JSON.stringify(combinedRule));
    console.log('Transition Rule', JSON.stringify(transitionRule));
    /* eslint-enable no-console */
    try {
        yield Promise.allSettled(((yield ((_a = client.rules) === null || _a === void 0 ? void 0 : _a.list(locationId))) || [])
            .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
            .map((r) => __awaiter(void 0, void 0, void 0, function* () {
            yield client.rules.delete(r.id, locationId);
            newRuleSummary.ruleIds = newRuleSummary.ruleIds.filter(rid => rid !== r.id);
        })));
    }
    catch (e) {
        throw new Error(`Failed to delete existing rules, aborting submitRules operation: [${e}]`);
    }
    const newCombinedRuleResponse = combinedRule && (yield client.rules.create(combinedRule, locationId)) || null;
    const newTransitionRuleResponse = transitionRule && (yield client.rules.create(transitionRule, locationId)) || null;
    const newRuleIds = [newCombinedRuleResponse === null || newCombinedRuleResponse === void 0 ? void 0 : newCombinedRuleResponse.id, newTransitionRuleResponse === null || newTransitionRuleResponse === void 0 ? void 0 : newTransitionRuleResponse.id].filter(id => !!id);
    newRuleSummary.ruleIds.push(...newRuleIds);
    // eslint-disable-next-line no-console
    // console.log('Applied Rules', newCombinedRuleResponse?.actions, newTransitionRuleResponse?.actions);
    return [newRuleSummary, newCombinedRuleResponse === null || newCombinedRuleResponse === void 0 ? void 0 : newCombinedRuleResponse.id, newTransitionRuleResponse === null || newTransitionRuleResponse === void 0 ? void 0 : newTransitionRuleResponse.id];
});
exports.default = submitRules;
//# sourceMappingURL=submitRulesForSmartAppOperation.js.map