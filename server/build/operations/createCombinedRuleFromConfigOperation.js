"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createCombinedRuleFromConfig = (appKey, dayTriggerAction, nightTriggerAction, idleAction) => {
    const ruleLabel = `${appKey}-rule`;
    if (!dayTriggerAction && !nightTriggerAction && !idleAction) {
        return null;
    }
    // array of rules excluding nulls
    const actions = [dayTriggerAction, nightTriggerAction, idleAction].filter(a => a);
    return {
        name: `${ruleLabel}`,
        actions: actions
    };
};
exports.default = createCombinedRuleFromConfig;
//# sourceMappingURL=createCombinedRuleFromConfigOperation.js.map