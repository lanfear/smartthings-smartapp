/* eslint-disable id-denylist */
import type {IntervalUnit, RuleAction, RuleCondition} from '@smartthings/core-sdk';
import global from '../constants/global';

export const generateConditionTrigger = (noonOffsetTime: number, actions: RuleAction[]): RuleAction => ({
  every: {
    specific: {
      reference: 'Noon',
      offset: {
        value: {
          integer: noonOffsetTime
        },
        unit: 'Minute'
      }
    },
    actions: actions
  }
});

// annoying that this is on both server and client side =(
export const generateConditionBetween = (noonOffsetStart: number, noonOffsetEnd: number): RuleCondition => ({
  between: {
    value: {
      time: {
        reference: 'Now'
      }
    },
    start: {
      time: {
        reference: 'Noon',
        offset: {
          value: {
            integer: noonOffsetStart
          },
          unit: 'Minute'
        }
      }
    },
    end: {
      time: {
        reference: 'Noon',
        offset: {
          value: {
            integer: noonOffsetEnd
          },
          unit: 'Minute'
        }
      }
    }
  }
});

export const generateConditionMotion = (motionDeviceIds: string[], andMultiple: boolean): RuleCondition => {
  const motionConditions: RuleCondition[] = motionDeviceIds.map(d => ({
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

export const generateConditionsNoMotion = (motionDeviceIds: string[]): RuleCondition[] => motionDeviceIds.map(d => ({
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

export const generateConditionDeviceOff = (switchDeviceId: string): RuleCondition => ({
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

export const generateConditionDeviceOn = (switchDeviceId: string): RuleCondition => ({
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

export const generateActionSleep = (sleepDuration: number, sleepUnit: IntervalUnit): RuleAction => ({
  sleep: {
    duration: {
      value: {
        integer: sleepDuration
      },
      unit: sleepUnit
    }
  }
});

export const generateActionSwitchLevel = (motionDeviceId: string, switchLevel: number, rateLevel: number = global.rule.default.switchLevelRate): RuleAction => ({
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

export const generateActionSwitchOn = (motionDeviceId: string): RuleAction => ({
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

export const generateActionSwitchOff = (motionDeviceIds: string[]): RuleAction => ({
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
