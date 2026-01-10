import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import {DeviceContext, SmartAppContext} from '@smartthings/smartapp';
import {ISmartAppRuleConfigValues, ISmartAppRuleSwitchLevelConfig} from '../types';
import global from '../constants/global';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const getDeviceConfigIfAuthenticated = async (context: SmartAppContext, configId: string): Promise<DeviceContext[] | null> => {
  if (!context.isAuthenticated()) {
    return null;
  }
  try {
    return await context.configDevices(configId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('get config failed even though isAuthenticated', e);
    return null;
  }
};

const getMinuteOffsetFromNoon = (timeString: string): number => {
  if (!timeString || timeString === '') {
    return 0;
  }
  const configDate = dayjs.utc(timeString, 'HH:mm A');

  const noonDate = configDate.hour(12).minute(0).second(0).millisecond(0);
  return configDate.diff(noonDate, 'minute');
};

const readConfigFromContext = async (context: SmartAppContext): Promise<ISmartAppRuleConfigValues> => ({
  enableAllRules: context.configBooleanValue('enableAllRules')?.valueOf(),
  enableDaylightRule: context.configBooleanValue('enableDaylightRule')?.valueOf(),
  enableNightlightRule: context.configBooleanValue('enableNightlightRule')?.valueOf(),
  enableIdleRule: context.configBooleanValue('enableIdleRule')?.valueOf(),
  motionSensors: await getDeviceConfigIfAuthenticated(context, 'motionSensor') ?? [],
  motionMultipleAll: context.configBooleanValue('motionMultipleAll')?.valueOf(),
  motionIdleTimeout: context.configNumberValue('motionIdleTimeout')?.valueOf(),
  motionIdleTimeoutUnit: context.configBooleanValue('motionIdleTimeoutUnit') ? 'Minute' : 'Second',
  motionDurationDelay: context.configNumberValue('motionDurationDelay')?.valueOf(),
  dayControlSwitch: (await getDeviceConfigIfAuthenticated(context, 'dayControlSwitch') ?? [null])[0],
  dayActiveSwitches: await getDeviceConfigIfAuthenticated(context, 'dayActiveSwitches') ?? [],
  nightControlSwitch: (await getDeviceConfigIfAuthenticated(context, 'nightControlSwitch') ?? [null])[0],
  nightActiveSwitches: await getDeviceConfigIfAuthenticated(context, 'nightActiveSwitches') ?? [],
  dayNightOffset: getMinuteOffsetFromNoon(context.configTimeString('dayNightOffsetTime')?.valueOf()),
  nightEndOffset: getMinuteOffsetFromNoon(context.configTimeString('nightEndOffsetTime')?.valueOf()),
  dayStartOffset: getMinuteOffsetFromNoon(context.configTimeString('dayStartOffsetTime')?.valueOf())
});

export const readDeviceLevelConfigFromContext = (context: SmartAppContext, devices: DeviceContext[]): ISmartAppRuleSwitchLevelConfig[] => devices.map(d => ({
  deviceId: d.deviceId,
  switchDayLevel: context.configNumberValue(`dayLevel${d.deviceId}`) ?? global.rule.default.switchDayLevel,
  switchNightLevel: context.configNumberValue(`nightLevel${d.deviceId}`) ?? global.rule.default.switchNightLevel
}));

export default readConfigFromContext;
