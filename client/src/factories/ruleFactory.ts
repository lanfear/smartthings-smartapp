import {Action, Condition, IntervalUnit, TimeReference} from '@smartthings/core-sdk';
import global from '../constants/global';

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

export const generateConditionMotion = (motionDeviceId: string): Condition => ({
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