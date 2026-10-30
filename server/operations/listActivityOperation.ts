import type {Device} from '@smartthings/core-sdk';
import type {IActivityDevice, IActivityKind, IActivityPeriod, IResponseActivity, Nullable} from 'types/sharedContracts';
import activityStore, {type IActivityEvent} from '../provider/activityStore';
import listDevicesFromApiOperation from './listDevicesFromApiOperation';
import {clampHistoryHours} from './listMeasurementHistoryOperation';

const msPerHour = 60 * 60 * 1000;

const activityAttributes: Record<IActivityKind, {capability: string; attribute: string; onValue: string}> = {
  motion: {capability: 'motionSensor', attribute: 'motion', onValue: 'active'},
  light: {capability: 'switch', attribute: 'switch', onValue: 'on'}
};

// the device's current value from includeStatus - only the main component, matching what the control app records
const getCurrentValue = (device: Device, kind: IActivityKind): Nullable<string> => {
  const {capability, attribute} = activityAttributes[kind];
  const value = device.components?.find(c => c.id === 'main')?.capabilities.find(c => c.id === capability)?.status?.[attribute]?.value;
  return typeof value === 'string' ? value : null;
};

/**
 * On/active stretches from `start` to `until`. The value in effect at `start` is the last event before it; failing
 * that, the opposite of the first event in the window; failing that (nothing has changed since recording started), the
 * device's current value.
 */
const buildPeriods = (before: Nullable<IActivityEvent>, events: IActivityEvent[], current: Nullable<string>, onValue: string, start: number, until: number): IActivityPeriod[] => {
  const initiallyOn = before
    ? before.value === onValue
    : events.length ? events[0].value !== onValue : current === onValue;
  const periods: IActivityPeriod[] = [];
  let onSince: Nullable<number> = initiallyOn ? start : null;
  for (const {epoch, value} of events) {
    if (value === onValue && onSince === null) {
      onSince = epoch;
    } else if (value !== onValue && onSince !== null) {
      periods.push([onSince, epoch]);
      onSince = null;
    }
  }
  if (onSince !== null) {
    periods.push([onSince, until]);
  }
  return periods;
};

/** motion sensor and switch activity for a location over the last `hours`, from what the control SmartApp recorded */
const listActivityOperation = async (locationId: string, hours?: number): Promise<IResponseActivity> => {
  const until = Date.now();
  const since = until - (clampHistoryHours(hours) * msPerHour);
  const recordingSince = await activityStore.getRecordingSince(locationId);

  // the capability filter can't OR, so one list per kind. a device with a motion sensor counts as motion only (some
  // motion sensors also expose a switch, e.g. to turn off their status light)
  const [motionDevices, switchDevices] = await Promise.all([
    listDevicesFromApiOperation({locationId: [locationId], capability: activityAttributes.motion.capability, includeStatus: true}),
    listDevicesFromApiOperation({locationId: [locationId], capability: activityAttributes.light.capability, includeStatus: true})
  ]);
  const motionIds = new Set(motionDevices.map(d => d.deviceId));
  const devicesByKind: [Device, IActivityKind][] = [
    ...motionDevices.map((d): [Device, IActivityKind] => [d, 'motion']),
    ...switchDevices.filter(d => !motionIds.has(d.deviceId)).map((d): [Device, IActivityKind] => [d, 'light'])
  ];

  // nothing is known before recording started, so periods only cover the recorded part of the window
  const start = recordingSince === null ? until : Math.max(since, recordingSince);
  const devices = await Promise.all(devicesByKind.map(async ([device, kind]): Promise<IActivityDevice> => {
    const {before, events} = recordingSince === null ? {before: null, events: []} : await activityStore.getEvents(locationId, device.deviceId, start);
    return {
      deviceId: device.deviceId,
      label: device.label ?? device.name ?? device.deviceId,
      ...(device.roomId ? {roomId: device.roomId} : {}),
      kind: kind,
      periods: recordingSince === null ? [] : buildPeriods(before, events, getCurrentValue(device, kind), activityAttributes[kind].onValue, start, until)
    };
  }));

  return {locationId, since, until, recordingSince, devices};
};

export default listActivityOperation;
