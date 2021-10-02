export interface ISmartAppRuleMotion {
    valueType: string, //STValueType?
    deviceConfig: {
        deviceId: string,
        componentId: string
    }
}

export interface ISmartAppRuleSwitch {
    valueType: string, //STValueType?
    deviceConfig: {
        deviceId: string,
        componentId: string
    }
}

export interface ISmartAppRuleTimeOffset {
    valueType: string, //STValueType?
    stringConfig: {
        value: string
    }
}

export interface ISmartAppRuleConfig {
    dayNightOffset: ISmartAppRuleTimeOffset [],
    nightEndOffset: ISmartAppRuleTimeOffset [],
    dayStartOffset: ISmartAppRuleTimeOffset [],
    dayControlSwitch: ISmartAppRuleSwitch [], // should be only 1, but it's an array
    dayActiveSwitches: ISmartAppRuleSwitch [],
    nightControlSwitch: ISmartAppRuleSwitch [], // should be only 1, but it's an array
    nightActiveSwitches: ISmartAppRuleSwitch [],
    motionSensor: ISmartAppRuleMotion [] // should be only 1, but it's an array
}
