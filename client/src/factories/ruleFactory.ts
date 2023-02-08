import {RuleAction, RuleCondition} from '@smartthings/core-sdk';
import global from '../constants/global';

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

export const generateConditionMotion = (motionDeviceId: string): RuleCondition => ({
  equals: {
    left: {
      device: {
        devices: [
          motionDeviceId
        ],
        component: 'main',
        capability: 'motionSensor',
        attribute: 'motion'
      }
    },
    right: {
      // eslint-disable-next-line id-denylist, id-blacklist
      string: 'active'
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
