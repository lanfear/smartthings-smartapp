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
const submitRules = (api, ruleStore, smartAppLookupKey, dayRule, nightRule, idleRule, transitionRule) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    /* eslint-disable no-console */
    console.log('Submitting Rules');
    console.log('DayRule', JSON.stringify(dayRule));
    console.log('NightRule', JSON.stringify(nightRule));
    console.log('IdleRule', JSON.stringify(idleRule));
    console.log('TransitionRule', JSON.stringify(transitionRule));
    /* eslint-enable no-console */
    yield Promise.all(((yield ((_a = api.rules) === null || _a === void 0 ? void 0 : _a.list())) || [])
        .filter(r => r.name.indexOf(smartAppLookupKey) !== -1)
        .map((r) => __awaiter(void 0, void 0, void 0, function* () { return yield api.rules.delete(r.id); })));
    const newRuleInfo = {
        dayLightRule: dayRule,
        nightLightRule: nightRule,
        idleRule: idleRule,
        transitionRule: transitionRule
    };
    const newDayRuleResponse = dayRule && (yield api.rules.create(dayRule)) || null;
    const newNightRuleResponse = nightRule && (yield api.rules.create(nightRule)) || null;
    const newIdleRuleResponse = idleRule && (yield api.rules.create(idleRule)) || null;
    const newTransitionRuleResponse = transitionRule && (yield api.rules.create(transitionRule)) || null;
    newRuleInfo.dayRuleId = newDayRuleResponse === null || newDayRuleResponse === void 0 ? void 0 : newDayRuleResponse.id;
    newRuleInfo.nightRuleId = newNightRuleResponse === null || newNightRuleResponse === void 0 ? void 0 : newNightRuleResponse.id;
    newRuleInfo.idleRuleId = newIdleRuleResponse === null || newIdleRuleResponse === void 0 ? void 0 : newIdleRuleResponse.id;
    newRuleInfo.transitionRuleId = newTransitionRuleResponse === null || newTransitionRuleResponse === void 0 ? void 0 : newTransitionRuleResponse.id;
    ruleStore.set(smartAppLookupKey, newRuleInfo);
    // eslint-disable-next-line no-console
    console.log('rules', yield api.rules.list());
});
exports.default = submitRules;
//# sourceMappingURL=submitRulesForSmartAppOperation.js.map