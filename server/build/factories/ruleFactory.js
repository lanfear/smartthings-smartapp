"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateActionSwitchOff = exports.generateActionSwitchOn = exports.generateActionSwitchLevel = exports.generateActionSleep = exports.generateConditionDeviceOn = exports.generateConditionDeviceOff = exports.generateConditionNoMotion = exports.generateConditionMotion = exports.generateConditionBetween = exports.generateConditionTrigger = void 0;
/* eslint-disable id-blacklist, id-denylist */
const core_sdk_1 = require("@smartthings/core-sdk");
const global_1 = __importDefault(require("../constants/global"));
const generateConditionTrigger = (noonOffsetTime, actions) => ({
    every: {
        specific: {
            reference: core_sdk_1.TimeReference.Noon,
            offset: {
                value: {
                    integer: noonOffsetTime
                },
                unit: core_sdk_1.IntervalUnit.Minute
            }
        },
        actions: actions
    }
});
exports.generateConditionTrigger = generateConditionTrigger;
// annoying that this is on both server and client side =(
const generateConditionBetween = (noonOffsetStart, noonOffsetEnd) => ({
    between: {
        value: {
            time: {
                reference: core_sdk_1.TimeReference.Now
            }
        },
        start: {
            time: {
                reference: core_sdk_1.TimeReference.Noon,
                offset: {
                    value: {
                        integer: noonOffsetStart
                    },
                    unit: core_sdk_1.IntervalUnit.Minute
                }
            }
        },
        end: {
            time: {
                reference: core_sdk_1.TimeReference.Noon,
                offset: {
                    value: {
                        integer: noonOffsetEnd
                    },
                    unit: core_sdk_1.IntervalUnit.Minute
                }
            }
        }
    }
});
exports.generateConditionBetween = generateConditionBetween;
const generateConditionMotion = (motionDeviceIds, andMultiple) => {
    const motionConditions = motionDeviceIds.map(d => ({
        equals: {
            left: {
                device: {
                    devices: [
                        d
                    ],
                    component: 'main',
                    capability: 'motionSensor',
                    attribute: 'motion'
                }
            },
            right: {
                string: 'active'
            }
        }
    }));
    return andMultiple ? { and: motionConditions } : { or: motionConditions };
};
exports.generateConditionMotion = generateConditionMotion;
const generateConditionNoMotion = (motionDeviceIds, andMultiple) => {
    const motionConditions = motionDeviceIds.map(d => ({
        equals: {
            left: {
                device: {
                    devices: [
                        d
                    ],
                    component: 'main',
                    capability: 'motionSensor',
                    attribute: 'motion'
                }
            },
            right: {
                string: 'inactive'
            }
        }
    }));
    return andMultiple ? { and: motionConditions } : { or: motionConditions };
};
exports.generateConditionNoMotion = generateConditionNoMotion;
const generateConditionDeviceOff = (switchDeviceId) => ({
    equals: {
        left: {
            device: {
                devices: [
                    switchDeviceId
                ],
                component: 'main',
                capability: 'switch',
                attribute: 'switch'
            }
        },
        right: {
            string: 'off'
        }
    }
});
exports.generateConditionDeviceOff = generateConditionDeviceOff;
const generateConditionDeviceOn = (switchDeviceId) => ({
    equals: {
        left: {
            device: {
                devices: [
                    switchDeviceId
                ],
                component: 'main',
                capability: 'switch',
                attribute: 'switch'
            }
        },
        right: {
            string: 'on'
        }
    }
});
exports.generateConditionDeviceOn = generateConditionDeviceOn;
const generateActionSleep = (sleepDuration, sleepUnit) => ({
    sleep: {
        duration: {
            value: {
                integer: sleepDuration
            },
            unit: sleepUnit
        }
    }
});
exports.generateActionSleep = generateActionSleep;
const generateActionSwitchLevel = (motionDeviceId, switchLevel, rateLevel = global_1.default.rule.default.switchLevelRate) => ({
    command: {
        devices: [
            motionDeviceId
        ],
        commands: [
            {
                component: 'main',
                capability: 'switchLevel',
                command: 'setLevel',
                arguments: [{ integer: switchLevel }, { integer: rateLevel }]
            }
        ]
    }
});
exports.generateActionSwitchLevel = generateActionSwitchLevel;
const generateActionSwitchOn = (motionDeviceId) => ({
    command: {
        devices: [
            motionDeviceId
        ],
        commands: [
            {
                component: 'main',
                capability: 'switch',
                command: 'on'
            }
        ]
    }
});
exports.generateActionSwitchOn = generateActionSwitchOn;
const generateActionSwitchOff = (motionDeviceIds) => ({
    command: {
        devices: motionDeviceIds,
        commands: [
            {
                component: 'main',
                capability: 'switch',
                command: 'off'
            }
        ]
    }
});
exports.generateActionSwitchOff = generateActionSwitchOff;
//# sourceMappingURL=ruleFactory.js.map