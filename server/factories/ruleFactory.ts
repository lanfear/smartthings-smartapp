import { Action, Condition, IntervalUnit, TimeReference } from "@smartthings/core-sdk";

export const generateConditionTrigger = (noonOffsetTime: number, actions: Action[]): Action => {
    return { 
        every: {
            specific: {
                reference: TimeReference.Noon,
                offset: {
                    value: {
                        integer: noonOffsetTime
                    },
                    unit: IntervalUnit.Minute
                }
            },
            actions: actions
        }
    }
}

// annoying that this is on both server and client side =(
export const generateConditionBetween = (noonOffsetStart: number, noonOffsetEnd: number): Condition => {
    return {
        between: {
            value: {
                time: {
                    reference: TimeReference.Now
                }
            },
            start: {
                time: {
                    reference: TimeReference.Noon,
                    offset: {
                        value: {
                            integer: noonOffsetStart
                        },
                        unit: IntervalUnit.Minute
                    }
                },
            },
            end: {
                time: {
                    reference: TimeReference.Noon,
                    offset: {
                        value: {
                            integer: noonOffsetEnd
                        },
                        unit: IntervalUnit.Minute
                    }
                },
            }
        }
    }
};

export const generateConditionMotion = (motionDeviceId: string): Condition => {
    return {
        equals: {
            left: {
                device: {
                    devices: [
                        motionDeviceId
                    ],
                    component: "main",
                    capability: "motionSensor",
                    attribute: "motion"
                }
            },
            right: {
                string: "active"
            }
        }
    }
}

export const generateConditionNoMotion = (motionDeviceId: string): Condition => {
    return {
        equals: {
            left: {
                device: {
                    devices: [
                        motionDeviceId
                    ],
                    component: "main",
                    capability: "motionSensor",
                    attribute: "motion"
                }
            },
            right: {
                string: "inactive"
            }
        }
    }
}

export const generateConditionDeviceOff = (switchDeviceId: string): Condition => {
    return {
        equals: {
            left: {
                device: {
                    devices: [
                        switchDeviceId
                    ],
                    component: "main",
                    capability: "switch",
                    attribute: "switch"
                }
            },
            right: {
                string: "off"
            }
        }
    }
}

export const generateConditionDeviceOn = (switchDeviceId: string): Condition => {
    return {
        equals: {
            left: {
                device: {
                    devices: [
                        switchDeviceId
                    ],
                    component: "main",
                    capability: "switch",
                    attribute: "switch"
                }
            },
            right: {
                string: "on"
            }
        }
    }
}

export const generateActionSleep = (sleepDuration: number, sleepUnit: IntervalUnit): Action => {
    return { 
        sleep: {
            duration: {
                value: {
                    integer: sleepDuration
                },
                unit: sleepUnit
            }
        }
    }
}

export const generateActionSwitchLevel = (motionDeviceId: string, switchLevel: number, rateLevel: number = 20): Action => {
    return {
        command: {
            devices: [
                motionDeviceId
            ],
            commands: [
                {
                    component: "main",
                    capability: "switchLevel",
                    command: "setLevel",
                    arguments: [{ integer: switchLevel }, { integer: rateLevel }]
                },
            ]
        }
    }
}

export const generateActionSwitchOn = (motionDeviceId: string): Action => {
    return {
        command: {
            devices: [
                motionDeviceId
            ],
            commands: [
                {
                    component: "main",
                    capability: "switch",
                    command: "on"
                },
            ]
        }
    }
}

export const generateActionSwitchOff = (motionDeviceIds: string[]): Action => {
    return {
        command: {
            devices: motionDeviceIds,
            commands: [
                {
                    component: "main",
                    capability: "switch",
                    command: "off"
                },
            ]
        }
    }
}