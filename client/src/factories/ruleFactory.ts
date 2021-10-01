import { Action, Condition, IntervalUnit, TimeReference } from "@smartthings/core-sdk";

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