import { RuleRequest, SmartThingsClient } from "@smartthings/core-sdk";
import JSONdb from "simple-json-db";
import { RuleStoreInfo } from "../types";

const submitRules = async (api: SmartThingsClient, ruleStore: JSONdb, smartAppLookupKey: string, dayRule: RuleRequest, nightRule: RuleRequest) => {
    await Promise.all(
        (await api.rules.list())
        .filter( r => r.name.indexOf(smartAppLookupKey) !== -1 )
        .map(async r => await api.rules.delete(r.id)));

    const newRuleInfo: RuleStoreInfo = {
        dayLightRule: dayRule,
        nightLightRule: nightRule
    };
    const newDayRuleResponse = await api.rules.create(dayRule);
    const newNightRuleResponse = await api.rules.create(nightRule);
    newRuleInfo.dayRuleId = newDayRuleResponse.id;
    newRuleInfo.nightRuleId = newNightRuleResponse.id;
    ruleStore.set(smartAppLookupKey, newRuleInfo);

    console.log('rules', await api.rules.list());
}

export default submitRules;