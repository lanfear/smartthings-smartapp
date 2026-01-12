import type {DeviceContext, SmartAppContext} from '@smartthings/smartapp';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import global from '../constants/global';
import getSmartThingsClient from '../provider/smartThingsClient';
import type {ISmartAppRuleConfigValues, ISmartAppRuleSwitchLevelConfig, Nullable} from '../types';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

// while a user is editing the smartapp, some values may be missing, but contain that to this editor page
type ContextSmartAppConfigValues = Omit<ISmartAppRuleConfigValues, 'dayControlSwitch' | 'nightControlSwitch'> & {
  dayControlSwitch: Nullable<DeviceContext>;
  nightControlSwitch: Nullable<DeviceContext>;
};
type ContextNumber = Nullable<number>;

const getAuthenticatedDeviceConfig = async (context: SmartAppContext, configId: string): Promise<DeviceContext[]> => {
  // if user has not yet configured this option return empty now
  if (!(configId in context.config)) {
    return [];
  }

  if (context.isAuthenticated()) {
    try {
      return await context.configDevices(configId);
    } catch (e) {
    // let if fall through to end
    }
  }
  // if user has not yet authenticated this app installation, or other error, we use our direct api token to get device info and turn it into DeviceContext
  return Promise.all(context.config[configId].map(async cc => {
    const d = await getSmartThingsClient().devices.get(cc.deviceConfig!.deviceId);
    return {
      deviceId: d.deviceId,
      name: d.name,
      label: d.label,
      componentId: cc.deviceConfig!.componentId
    } as DeviceContext;
  }));
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

const readConfigFromContext = async (context: SmartAppContext): Promise<ContextSmartAppConfigValues> => ({
  enableAllRules: getPrimitiveVarFromContextOrDefault(context, 'enableAllRules', context.configBooleanValue.bind(context), true as boolean),
  enableDaylightRule: getPrimitiveVarFromContextOrDefault(context, 'enableDaylightRule', context.configBooleanValue.bind(context), true as boolean),
  enableNightlightRule: getPrimitiveVarFromContextOrDefault(context, 'enableNightlightRule', context.configBooleanValue.bind(context), true as boolean),
  enableIdleRule: getPrimitiveVarFromContextOrDefault(context, 'enableIdleRule', context.configBooleanValue.bind(context), true as boolean),
  motionSensors: await getAuthenticatedDeviceConfig(context, 'motionSensor'),
  motionMultipleAll: getPrimitiveVarFromContextOrDefault(context, 'motionMultipleAll', context.configBooleanValue.bind(context), false as boolean),
  motionIdleTimeout: getPrimitiveVarFromContextOrDefault(context, 'motionIdleTimeout', context.configNumberValue.bind(context), 0 as number),
  motionIdleTimeoutUnit: getPrimitiveVarFromContextOrDefault(context, 'motionIdleTimeoutUnit', context.configBooleanValue.bind(context), false as boolean) ? 'Minute' : 'Second',
  motionDurationDelay: getPrimitiveVarFromContextOrDefault(context, 'motionDurationDelay', context.configNumberValue.bind(context), 0 as number),
  dayControlSwitch: (await getAuthenticatedDeviceConfig(context, 'dayControlSwitch'))[0] ?? null,
  dayActiveSwitches: await getAuthenticatedDeviceConfig(context, 'dayActiveSwitches'),
  nightControlSwitch: (await getAuthenticatedDeviceConfig(context, 'nightControlSwitch'))[0] ?? null,
  nightActiveSwitches: await getAuthenticatedDeviceConfig(context, 'nightActiveSwitches'),
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  dayNightOffset: getMinuteOffsetFromNoon(getPrimitiveVarFromContextOrDefault(context, 'dayNightOffsetTime', context.configTimeString.bind(context), dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString())),
  nightEndOffset: getMinuteOffsetFromNoon(getPrimitiveVarFromContextOrDefault(context, 'nightEndOffsetTime', context.configTimeString.bind(context), dayjs().hour(20).minute(0).second(0).millisecond(0).toISOString())),
  dayStartOffset: getMinuteOffsetFromNoon(getPrimitiveVarFromContextOrDefault(context, 'dayStartOffsetTime', context.configTimeString.bind(context), dayjs().hour(8).minute(0).second(0).millisecond(0).toISOString()))
  /* eslint-enable @typescript-eslint/no-magic-numbers */
});

export const readDeviceLevelConfigFromContext = (context: SmartAppContext, devices: DeviceContext[]): ISmartAppRuleSwitchLevelConfig[] => devices.map(d => ({
  deviceId: d.deviceId,
  switchDayLevel: context.configNumberValue(`dayLevel${d.deviceId}`) as ContextNumber ?? global.rule.default.switchDayLevel,
  switchNightLevel: context.configNumberValue(`nightLevel${d.deviceId}`) as ContextNumber ?? global.rule.default.switchNightLevel
}));

export default readConfigFromContext;
