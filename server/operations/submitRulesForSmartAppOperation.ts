import { RuleRequest, SmartThingsClient } from "@smartthings/core-sdk";
import JSONdb from "simple-json-db";
import { RuleStoreInfo } from "../types";

const submitRules = async (api: SmartThingsClient, ruleStore: JSONdb, smartAppLookupKey: string, dayRule: RuleRequest, nightRule: RuleRequest, idleRule: RuleRequest, transitionRule: RuleRequest) => {
    await Promise.all(
        (await api.rules?.list() || [])
        .filter( r => r.name.indexOf(smartAppLookupKey) !== -1 )
        .map(async r => await api.rules.delete(r.id)));

    const newRuleInfo: RuleStoreInfo = {
        dayLightRule: dayRule,
        nightLightRule: nightRule,
        idleRule: idleRule,
        transitionRule: transitionRule
    };
    const newDayRuleResponse = await api.rules.create(dayRule);
    const newNightRuleResponse = await api.rules.create(nightRule);
    const newIdleRuleResponse = await api.rules.create(idleRule);
    const newTransitionRuleResponse = await api.rules.create(transitionRule);
    newRuleInfo.dayRuleId = newDayRuleResponse.id;
    newRuleInfo.nightRuleId = newNightRuleResponse.id;
    newRuleInfo.idleRuleId = newIdleRuleResponse.id;
    newRuleInfo.transitionRuleId = newTransitionRuleResponse.id;
    ruleStore.set(smartAppLookupKey, newRuleInfo);

    console.log('rules', await api.rules.list());
}

export default submitRules;