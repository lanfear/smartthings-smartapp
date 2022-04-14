import React from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {Room as IRoom} from '@smartthings/core-sdk';
import {useEventSource, useEventSourceListener} from 'react-sse-hooks';
import styled from 'styled-components';
import {useLocalStorage} from 'use-hooks';
import {DeviceContext, IApp, IDevice, IRule, ISseEvent} from '../types/sharedContracts';
import Device from './Device';
import Power from './Power';
import {useDeviceContext} from '../store/DeviceContextStore';
import SmartApp from './SmartApp';
import getRulesFromSummary from '../operations/getRulesFromSummary';
import Rule from './Rule';

dayjs.extend(isBetween);

const RoomContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid gray;
  border-radius: 4px;
`;

const RoomControlGrid = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: max-content 1fr 2rem;
  gap: 2px;
`;

const RoomControlPower = styled.span`
  display: flex;
  grid-column-start: 1;
  grid-column-end: 1;
  grid-row-start: 1;
  grid-row-end: 1;
`;

const RoomControlTitle = styled.span`
  width: 100%;
  display: flex;
  grid-column-start: 2;
  grid-column-end: 6;
  grid-row-start: 1;
  grid-row-end: 1;
  justify-content: center;
  align-items: center;
  font-size: larger;
  font-weight: 700;
`;

const RoomControlDevices = styled.span`
  display: flex;
  grid-column-start: 1;
  grid-column-end: 6;
  grid-row-start: 2;
  grid-row-end: 2;
  flex-wrap: wrap;
  align-content: center;
`;

const RoomControlDeviceLabel = styled.span`
  display: flex;
  grid-column-start: 1;
  grid-column-end: 6;
  grid-row-start: 3;
  grid-row-end: 3;
  justify-content: center;
  align-items: center;
`;

const Room: React.FC<IRoomProps> = ({room}) => {
  const {deviceData, setDeviceData} = useDeviceContext();
  const [activeDevice, setActiveDevice] = useLocalStorage(`smartAppRoom-${room.roomId as string}-activeDevice`, null as IDevice | null);
  
  const roomSwitches = deviceData.switches.filter(d => d.roomId === room.roomId);
  const roomLocks = deviceData.locks.filter(d => d.roomId === room.roomId);
  const roomMotion = deviceData.motion.filter(d => d.roomId === room.roomId);
  const findRuleForRoom = (): IRule[] => {
    const iRoomRules = deviceData.rules.filter(r => r.ruleSummary?.motionSensors.some((m: DeviceContext) => roomMotion.some(rm => rm.deviceId === m.deviceId)));
    return iRoomRules;
  };
  const findAppsForRoom = (): IApp[] => {
    const iRoomApps = deviceData.apps.filter(a => a.ruleSummary?.motionSensors.some((m: DeviceContext) => roomMotion.some(rm => rm.deviceId === m.deviceId)));
    return iRoomApps;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const roomRules = findRuleForRoom(); // eslint-disable-line @typescript-eslint/no-use-before-define
  const roomApps = findAppsForRoom();

  const roomRuleSummaries = roomApps.map(a => getRulesFromSummary(a.ruleSummary));
  const activeRuleControlSwitches = roomRuleSummaries.map(r => {
    // eslint-disable-next-line no-console
    if (r.dayRule && dayjs().utc().isBetween(r.dayRule.startTime, r.dayRule.endTime)) {
      return r.dayRule.controlDevice;
    }
    if (r.nightRule && dayjs().utc().isBetween(r.nightRule.startTime, r.nightRule.endTime)) {
      return r.nightRule.controlDevice;
    }
    return null;
  }).filter(d => !!d);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lockedDevices = roomSwitches.filter(r => activeRuleControlSwitches.some(did => r.deviceId === did!.deviceId));

  const deviceEventSource = useEventSource({
    source: `${process.env.REACT_APP_APIHOST as string}/events`
  });

  const handleSwitchDeviceEvent = (eventData: ISseEvent): void => {
    const targetDevice = roomSwitches.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      setDeviceData({...deviceData});
    }
  };

  const handleLockDeviceEvent = (eventData: ISseEvent): void => {
    const targetDevice = roomLocks.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      setDeviceData({...deviceData});
    }
  };

  const handleMotionDeviceEvent = (eventData: ISseEvent): void => {
    const targetDevice = roomMotion.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      setDeviceData({...deviceData});
    }
  };

  // const handleRuleDeviceEvent = (eventData: ISseRuleEvent): void => {
  //   // ??
  // }

  useEventSourceListener<ISseEvent>({
    source: deviceEventSource,
    startOnInit: true,
    event: {
      name: 'lock',
      listener: ({data}) => handleLockDeviceEvent(data)
    }
  }, [deviceEventSource]);

  useEventSourceListener<ISseEvent>({
    source: deviceEventSource,
    startOnInit: true,
    event: {
      name: 'motion',
      listener: ({data}) => handleMotionDeviceEvent(data)
    }
  }, [deviceEventSource]);

  useEventSourceListener<ISseEvent>({
    source: deviceEventSource,
    startOnInit: true,
    event: {
      name: 'switch',
      listener: ({data}) => handleSwitchDeviceEvent(data)
    }
  }, [deviceEventSource]);

  return (
    <RoomContainer>
      <RoomControlGrid>
        <RoomControlPower>
          <Power
            room={room}
            isPowerOn={true}
          />
        </RoomControlPower>
        <RoomControlTitle>
          {room.name}
        </RoomControlTitle>
        <RoomControlDevices>
          {roomSwitches.map(s => (
            <Device
              key={`switch-${s.deviceId}`}
              device={s}
              deviceType="Switch"
              setActiveDevice={setActiveDevice}
            />
          ))}
          {roomLocks.map(s => (
            <Device
              key={`lock-${s.deviceId}`}
              device={s}
              deviceType="Lock"
              setActiveDevice={setActiveDevice}
            />
          ))}
          {roomMotion.map(s => (
            <Device
              key={`motion-${s.deviceId}`}
              device={s}
              deviceType="Motion"
              setActiveDevice={setActiveDevice}
            />
          ))}
          {roomApps.map(a => {
            const ruleParts = getRulesFromSummary(a.ruleSummary);
            return (
              <>
                <SmartApp
                  key={`app-${a.installedAppId}`}
                  app={a}
                  isRuleEnabled={true}
                />
                {ruleParts.dayRule && (
                  <Rule
                    ruleType="Daylight"
                    time={`${ruleParts.dayRule.startTime.format('HH:mm')} - ${ruleParts.dayRule.endTime.format('HH:mm')}`}
                    isRuleEnabled={true}
                  />
                )}
                {ruleParts.transitionRule && (
                  <Rule
                    ruleType="Transition"
                    time={ruleParts.transitionRule.time.format('HH:mm')}
                    isRuleEnabled={true}
                  />
                )}
                {ruleParts.nightRule && (
                  <Rule
                    ruleType="Nightlight"
                    time={`${ruleParts.nightRule.startTime.format('HH:mm')} - ${ruleParts.nightRule.endTime.format('HH:mm')}`}
                    isRuleEnabled={true}
                  />
                )}
                {ruleParts.idleRule && (
                  <Rule
                    ruleType="Idle"
                    time={ruleParts.idleRule.motionTimeout}
                    isRuleEnabled={true}
                  />
                )}
              </>
            );
          })}
        </RoomControlDevices>
        <RoomControlDeviceLabel>
          {activeDevice?.label}
        </RoomControlDeviceLabel>
      </RoomControlGrid>
    </RoomContainer>
  );
};

export interface IRoomProps {
  room: IRoom;
}

export default Room;