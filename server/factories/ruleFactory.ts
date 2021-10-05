/* eslint-disable id-blacklist, id-denylist */
import {Action, Condition, IntervalUnit, TimeReference} from '@smartthings/core-sdk';
import global from '../constants/global';

export const generateConditionTrigger = (noonOffsetTime: number, actions: Action[]): Action => ({
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
});

// annoying that this is on both server and client side =(
export const generateConditionBetween = (noonOffsetStart: number, noonOffsetEnd: number): Condition => ({
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
      }
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
      }
    }
  }
});

export const generateConditionMotion = (motionDeviceIds: string[], andMultiple: boolean): Condition => {
  const motionConditions: Condition[] = motionDeviceIds.map(d => ({
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

  return andMultiple ? {and: motionConditions} : {or: motionConditions};
};

export const generateConditionNoMotion = (motionDeviceIds: string[], andMultiple: boolean): Condition => {
  const motionConditions: Condition[] = motionDeviceIds.map(d => ({
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

  return andMultiple ? {and: motionConditions} : {or: motionConditions};
};

export const generateConditionDeviceOff = (switchDeviceId: string): Condition => ({
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

export const generateConditionDeviceOn = (switchDeviceId: string): Condition => ({
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

export const generateActionSleep = (sleepDuration: number, sleepUnit: IntervalUnit): Action => ({
  sleep: {
    duration: {
      value: {
        integer: sleepDuration
      },
      unit: sleepUnit
    }
  }
});

export const generateActionSwitchLevel = (motionDeviceId: string, switchLevel: number, rateLevel: number = global.rule.default.switchLevelRate): Action => ({
  command: {
    devices: [
      motionDeviceId
    ],
    commands: [
      {
        component: 'main',
        capability: 'switchLevel',
        command: 'setLevel',
        arguments: [{integer: switchLevel}, {integer: rateLevel}]
      }
    ]
  }
});

export const generateActionSwitchOn = (motionDeviceId: string): Action => ({
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

export const generateActionSwitchOff = (motionDeviceIds: string[]): Action => ({
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