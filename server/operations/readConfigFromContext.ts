import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import {DeviceContext, SmartAppContext} from '@smartthings/smartapp';
import {ISmartAppRuleConfigValues, ISmartAppRuleSwitchLevelConfig, Nullable} from '../types';
import global from '../constants/global';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

// while a user is editing the smartapp, some values may be missing, but contain that to this editor page
type ContextSmartAppConfigValues = Omit<ISmartAppRuleConfigValues, 'dayControlSwitch' | 'nightControlSwitch'> & {
  dayControlSwitch: Nullable<DeviceContext>;
  nightControlSwitch: Nullable<DeviceContext>;
};
type ContextNumber = Nullable<number>;

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

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const noonDate = configDate.hour(12).minute(0).second(0).millisecond(0);
  return configDate.diff(noonDate, 'minute');
};

type PrimitiveRetrievers = SmartAppContext['configBooleanValue'] | SmartAppContext['configNumberValue'] | SmartAppContext['configStringValue'] | SmartAppContext['configTimeString'];
const getPrimitiveVarFromContextOrDefault = <T extends number | string | boolean>(context: SmartAppContext, id: string, retriever: PrimitiveRetrievers, defaultValue: T): T => Object.keys(context.config).includes(id) ? (retriever(id).valueOf() as T) : defaultValue;

const readConfigFromContext = async (context: SmartAppContext): Promise<ContextSmartAppConfigValues> => {
  console.log('Reading config from context');
  console.log(await context.retrieveTokens());

  return {
    enableAllRules: getPrimitiveVarFromContextOrDefault(context, 'enableAllRules', context.configBooleanValue.bind(context), true as boolean),
    enableDaylightRule: getPrimitiveVarFromContextOrDefault(context, 'enableDaylightRule', context.configBooleanValue.bind(context), true as boolean),
    enableNightlightRule: getPrimitiveVarFromContextOrDefault(context, 'enableNightlightRule', context.configBooleanValue.bind(context), true as boolean),
    enableIdleRule: getPrimitiveVarFromContextOrDefault(context, 'enableIdleRule', context.configBooleanValue.bind(context), true as boolean),
    motionSensors: await getDeviceConfigIfAuthenticated(context, 'motionSensor') ?? [],
    motionMultipleAll: getPrimitiveVarFromContextOrDefault(context, 'motionMultipleAll', context.configBooleanValue.bind(context), false as boolean),
    motionIdleTimeout: getPrimitiveVarFromContextOrDefault(context, 'motionIdleTimeout', context.configNumberValue.bind(context), 0 as number),
    motionIdleTimeoutUnit: getPrimitiveVarFromContextOrDefault(context, 'motionIdleTimeoutUnit', context.configBooleanValue.bind(context), false as boolean) ? 'Minute' : 'Second',
    motionDurationDelay: getPrimitiveVarFromContextOrDefault(context, 'motionDurationDelay', context.configNumberValue.bind(context), 0 as number),
    dayControlSwitch: (await getDeviceConfigIfAuthenticated(context, 'dayControlSwitch') ?? [null])[0],
    dayActiveSwitches: await getDeviceConfigIfAuthenticated(context, 'dayActiveSwitches') ?? [],
    nightControlSwitch: (await getDeviceConfigIfAuthenticated(context, 'nightControlSwitch') ?? [null])[0],
    nightActiveSwitches: await getDeviceConfigIfAuthenticated(context, 'nightActiveSwitches') ?? [],
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    dayNightOffset: getMinuteOffsetFromNoon(getPrimitiveVarFromContextOrDefault(context, 'dayNightOffsetTime', context.configTimeString.bind(context), dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString())),
    nightEndOffset: getMinuteOffsetFromNoon(getPrimitiveVarFromContextOrDefault(context, 'nightEndOffsetTime', context.configTimeString.bind(context), dayjs().hour(20).minute(0).second(0).millisecond(0).toISOString())),
    dayStartOffset: getMinuteOffsetFromNoon(getPrimitiveVarFromContextOrDefault(context, 'dayStartOffsetTime', context.configTimeString.bind(context), dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString()))
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  };
};

export const readDeviceLevelConfigFromContext = (context: SmartAppContext, devices: DeviceContext[]): ISmartAppRuleSwitchLevelConfig[] => devices.map(d => ({
  deviceId: d.deviceId,
  switchDayLevel: context.configNumberValue(`dayLevel${d.deviceId}`) as ContextNumber ?? global.rule.default.switchDayLevel,
  switchNightLevel: context.configNumberValue(`nightLevel${d.deviceId}`) as ContextNumber ?? global.rule.default.switchNightLevel
}));

export default readConfigFromContext;
