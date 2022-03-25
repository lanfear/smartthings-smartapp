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
const submitRules = (api, ruleStore, smartAppLookupKey, combinedRule, transitionRule) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    /* eslint-disable no-console */
    console.log('Submitting Rules');
    console.log('Rule', JSON.stringify(combinedRule));
    /* eslint-enable no-console */
    yield Promise.all(((yield ((_a = api.rules) === null || _a === void 0 ? void 0 : _a.list())) || [])
        .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
        .map((r) => __awaiter(void 0, void 0, void 0, function* () { return yield api.rules.delete(r.id); })));
    // this object and the return from the rules calls below are currently unused... but the rule guid may be interesting to stash away someday
    const newRuleInfo = {
        combinedRule,
        transitionRule
    };
    const newCombinedRuleResponse = combinedRule && (yield api.rules.create(combinedRule)) || null;
    newRuleInfo.combinedRuleId = newCombinedRuleResponse === null || newCombinedRuleResponse === void 0 ? void 0 : newCombinedRuleResponse.id;
    const newTransitionRuleResponse = transitionRule && (yield api.rules.create(transitionRule)) || null;
    newRuleInfo.transitionRuleId = newTransitionRuleResponse === null || newTransitionRuleResponse === void 0 ? void 0 : newTransitionRuleResponse.id;
    // eslint-disable-next-line no-console
    console.log('Applied Rules', yield api.rules.list());
    ruleStore.set(smartAppLookupKey, newRuleInfo);
});
exports.default = submitRules;
//# sourceMappingURL=submitRulesForSmartAppOperation.js.map