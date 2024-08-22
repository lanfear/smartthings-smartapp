import React, {useEffect, useRef} from 'react';
import dayjs, {Dayjs} from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {Room as IRoom} from '@smartthings/core-sdk';
import {useEventSource, useEventSourceListener} from 'react-sse-hooks';
import styled from 'styled-components';
import {useLocalStorage} from 'usehooks-ts';
import {DeviceContext, IApp, IDevice, IRule, ISseEvent} from '../types/sharedContracts';
import global from '../constants/global';
import Device from './Device';
import Power from './Power';
import {useDeviceContext} from '../store/DeviceContextStore';
import SmartApp from './SmartApp';
import getRulesFromSummary, {IRuleIdle, IRuleRange, IRuleTransition} from '../operations/getRulesFromSummary';
import Rule from './Rule';
import {IActiveControl} from '../types/interfaces';

dayjs.extend(isBetween);

const numDevicesPerRow = 5;

// 32E624 green bg
// ideas: 🪄 🔮 🕹 🔌 💾 🔐 🔑 🔂

const isRuleActive = (startTime: Dayjs, endTime: Dayjs): boolean => dayjs().isBetween(startTime, endTime);
const isLinkedRuleActive = (rule: IRuleRange, rulePart: string, ruleBaseId: string, activeDeviceId?: string): boolean => !!activeDeviceId && (
  rule.controlDevice.deviceId === activeDeviceId ||
    Object.values(rule.switchDevices).some(d => d.deviceId === activeDeviceId) ||
    activeDeviceId.endsWith(`${rulePart.toLowerCase()}-${ruleBaseId}`)
);

const isLockedRuleActive = (lockedDevices: IDevice[], rule: IRuleRange, rulePart: string, ruleBaseId: string, activeDeviceId?: string): boolean =>
  !!activeDeviceId && (
    rule.controlDevice.deviceId === activeDeviceId || (
      isRuleActive(rule.startTime, rule.endTime) &&
      activeDeviceId.endsWith(`${rulePart.toLowerCase()}-${ruleBaseId}`)
    )
  );

const isLinkedDeviceActive = (roomRuleSummaries: Record<string, {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle}>, deviceId: string, activeDeviceId?: string): boolean =>
  !!activeDeviceId && (
    (deviceId === activeDeviceId) ||
    Object.entries(roomRuleSummaries).some(([k, v]) => (
      (activeDeviceId.endsWith(`daylight-${k}`) && v.dayRule &&
        (v.dayRule.controlDevice.deviceId === deviceId || Object.values(v.dayRule.switchDevices).some(d => d.deviceId === deviceId))) || // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing

      (activeDeviceId.endsWith(`nightlight-${k}`) && v.nightRule &&
        (v.nightRule.controlDevice.deviceId === deviceId || Object.values(v.nightRule.switchDevices).some(d => d.deviceId === deviceId)))
    )));

const isLockedDeviceActive = (lockedDevices: IDevice[], roomRuleSummaries: Record<string, {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle}>, deviceId: string, activeDeviceId?: string): boolean =>
  !!activeDeviceId && (
    (lockedDevices.some(d => d.deviceId === deviceId) && deviceId === activeDeviceId) ||
    (Object.entries(roomRuleSummaries).some(([k, v]) =>
      ((activeDeviceId.endsWith(`daylight-${k}`) && v.dayRule && v.dayRule.controlDevice.deviceId === deviceId && isRuleActive(v.dayRule.startTime, v.dayRule.endTime)) || // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
       (activeDeviceId.endsWith(`nightlight-${k}`) && v.nightRule && v.nightRule.controlDevice.deviceId === deviceId && isRuleActive(v.nightRule.startTime, v.nightRule.endTime)))))
  );

const RoomContainer = styled.div`
  height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid gray;
  border-radius: 4px;
`;

// each 'app' gets a row, up to 5 devices / row, plus reserved rows
const RoomControlGrid = styled.div<{numDevices: number; numApps: number}>`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows:
    max-content
    repeat(${props => Math.max(Math.ceil(props.numDevices / numDevicesPerRow) + props.numApps, 1)}, max-content)
    1fr;
  grid-template-columns: [device-start app-start] 1fr [device-end app-end device-start rule-day-start] 1fr [device-end rule-day-end device-start rule-trans-start] 1fr [device-end rule-trans-end device-start rule-night-start] 1fr [device-end rule-night-end device-start rule-idle-start] 1fr [device-end rule-idle-end];
  // grid-template-columns: repeat(5, 1fr);
  // grid-template-rows: max-content 1fr 2rem;
  gap: ${global.measurements.deviceGridGap};
`;

const RoomControlPower = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column-start: 1;
  grid-column-end: 1;
  grid-row-start: 1;
  grid-row-end: 1;
`;

const RoomControlTitle = styled.div`
  width: 100%;
  display: flex;
  grid-column-start: 2;
  grid-column-end: 5;
  grid-row-start: 1;
  grid-row-end: 1;
  justify-content: center;
  align-items: center;
  font-size: larger;
  font-weight: 700;
`;

const RoomControlTitleText = styled.span`
  padding: 0 0.5rem;
  background: #${global.palette.control.rgb.inactive}${global.palette.control.alpha};
  box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );
  backdrop-filter: blur( 15px );
  border-radius: 10px;
  border: 1px solid rgba( 255, 255, 255, 0.18 );
`;

const RoomControlTitleFloor = styled.span`
  padding: 0 0.5rem;
  background: #${global.palette.control.rgb.floor}${global.palette.control.alpha};
  box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );
  backdrop-filter: blur( 15px );
  border-radius: 50%;
  border: 1px solid rgba( 255, 255, 255, 0.18 );
  font-size: small;
  color: #000;
`;

const RoomControlFavorite = styled.button`
  all: unset;
  display: flex;
  grid-column-start: 5;
  grid-column-end: 6;
  grid-row-start: 1;
  grid-row-end: 1;
  justify-content: center;
  align-items: center;
  font-size: larger;
  font-weight: 700;
  cursor: pointer;
`;

const RoomControlDevice = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  &:nth-child(5n+1) {
    grid-column: device-start 1 / device-end 1
  }
  &:nth-child(5n+2) {
    grid-column: device-start 2 / device-end 2
  }
  &:nth-child(5n+3) {
    grid-column: device-start 3 / device-end 3
  }
  &:nth-child(5n+4) {
    grid-column: device-start 4 / device-end 4
  }
  &:nth-child(5n+5) {
    grid-column: device-start 5 / device-end 5
  }
`;

const RoomControlRule = styled.div<{gridLineName: string}>`
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column: ${props => props.gridLineName}-start / ${props => props.gridLineName}-end
`;

const RoomControlDeviceLabel = styled.div`
  display: flex;
  grid-column-start: 1;
  grid-column-end: -1;
  grid-row-start: -2;
  grid-row-end: -1;
  justify-content: center;
  align-items: end;
  min-height: 2rem;
`;

const Room: React.FC<IRoomProps> = ({room, isFavoriteRoom, setFavoriteRoom}) => {
  const {deviceData, setDeviceData} = useDeviceContext();
  const [activeDevice, setActiveDevice] = useLocalStorage(`smartAppRoom-${room.roomId!}-activeDevice`, null as IActiveControl | null);
  const domRef = useRef<HTMLDivElement>(null);

  const roomSwitches = deviceData.switches.filter(d => d.roomId === room.roomId);
  const roomLocks = deviceData.locks.filter(d => d.roomId === room.roomId);
  const roomMotion = deviceData.motion.filter(d => d.roomId === room.roomId);
  const findRuleForRoom = (): IRule[] => {
    const iRoomRules = deviceData.rules.filter(r => r.ruleSummary.motionSensors.some((m: DeviceContext) => roomMotion.some(rm => rm.deviceId === m.deviceId)));
    return iRoomRules;
  };
  const findAppsForRoom = (): IApp[] => {
    const iRoomApps = deviceData.apps.filter(a => a.ruleSummary.motionSensors.some((m: DeviceContext) => roomMotion.some(rm => rm.deviceId === m.deviceId)));
    return iRoomApps;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const roomRules = findRuleForRoom();
  const roomApps = findAppsForRoom();

  const roomRuleSummaries = roomApps.reduce<Record<string, {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle}>>((p, c) => {
    p[c.installedAppId] = getRulesFromSummary(c.ruleSummary);
    return p;
  }, {});

  const activeRuleControlSwitches = Object.values(roomRuleSummaries).map(r => {
    if (r.dayRule && dayjs().isBetween(r.dayRule.startTime, r.dayRule.endTime)) {
      return r.dayRule.controlDevice;
    }
    if (r.nightRule && dayjs().isBetween(r.nightRule.startTime, r.nightRule.endTime)) {
      return r.nightRule.controlDevice;
    }
    return null;
  }).filter(d => !!d);

  const lockedDevices = roomSwitches.filter(r => activeRuleControlSwitches.some(did => r.deviceId === did!.deviceId));

  const numDevices = roomSwitches.length + roomLocks.length + roomMotion.length;

  const deviceEventSource = useEventSource({
    source: `${process.env.SMARTAPP_BUILDTIME_APIHOST!}/events`
  });

  const roomParts = room.name!.split(' - ');
  const roomName = roomParts.length > 1 ? roomParts[1] : roomParts[0];
  const roomFloor = roomParts.length > 1 ? roomParts[0] : null;

  const handleSwitchDeviceEvent = async (eventData: ISseEvent): Promise<void> => {
    const targetDevice = roomSwitches.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      await setDeviceData({...deviceData}, {revalidate: false});
    }
  };

  const handleLockDeviceEvent = async (eventData: ISseEvent): Promise<void> => {
    const targetDevice = roomLocks.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      await setDeviceData({...deviceData}, {revalidate: false});
    }
  };

  const handleMotionDeviceEvent = async (eventData: ISseEvent): Promise<void> => {
    const targetDevice = roomMotion.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      await setDeviceData({...deviceData}, {revalidate: false});
    }
  };

  useEffect(() => {
    if (isFavoriteRoom) {
      domRef.current!.scrollIntoView({behavior: 'smooth'});
    }
  }, [isFavoriteRoom]);

  // TODO: these can probably just go into the store context handler?
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
    // eslint-disable-next-line no-undefined
    <RoomContainer ref={domRef}>
      <RoomControlGrid
        numDevices={numDevices}
        numApps={roomApps.length}
      >
        {roomSwitches.map(s => (
          <RoomControlDevice
            key={`switch-${s.deviceId}`}
          >
            <Device
              device={s}
              deviceType="Switch"
              setActiveDevice={setActiveDevice}
              isLocked={lockedDevices.some(d => d.deviceId === s.deviceId)}
              isLinkedActive={isLinkedDeviceActive(roomRuleSummaries, s.deviceId, activeDevice?.id)}
              isLockedActive={isLockedDeviceActive(lockedDevices, roomRuleSummaries, s.deviceId, activeDevice?.id)}
            />
          </RoomControlDevice>
        ))}
        {roomLocks.map(s => (
          <RoomControlDevice
            key={`lock-${s.deviceId}`}
          >
            <Device
              device={s}
              deviceType="Lock"
              setActiveDevice={setActiveDevice}
            />
          </RoomControlDevice>
        ))}
        {roomMotion.map(s => (
          <RoomControlDevice
            key={`motion-${s.deviceId}`}
          >
            <Device
              device={s}
              deviceType="Motion"
              setActiveDevice={setActiveDevice}
            />
          </RoomControlDevice>
        ))}
        {roomApps.map(a => {
          const ruleParts = getRulesFromSummary(a.ruleSummary);

          return (
            <React.Fragment key={`rulesection-${a.installedAppId}`}>
              <RoomControlRule
                key={`app-${a.installedAppId}`}
                gridLineName="app"
              >
                <SmartApp
                  app={a}
                  isRuleEnabled={true}
                  setActiveDevice={setActiveDevice}
                />
              </RoomControlRule>
              {ruleParts.dayRule && (
                <RoomControlRule
                  key={`rulepart-daylight-${a.installedAppId}`}
                  gridLineName="rule-day"
                >
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Daylight Rule`}
                    ruleType="daylight"
                    time={`${ruleParts.dayRule.startTime.format('hA')} - ${ruleParts.dayRule.endTime.format('hA')}`}
                    isRuleActive={isRuleActive(ruleParts.dayRule.startTime, ruleParts.dayRule.endTime)}
                    isRuleEnabled={a.ruleSummary.enableDaylightRule && !a.ruleSummary.temporaryDisableDaylightRule}
                    isKeyRule={isRuleActive(ruleParts.dayRule.startTime, ruleParts.dayRule.endTime) && lockedDevices.length > 0}
                    setActiveDevice={setActiveDevice}
                    isLinkedActive={isLinkedRuleActive(ruleParts.dayRule, 'daylight', a.installedAppId, activeDevice?.id)}
                    isLockedActive={isLockedRuleActive(lockedDevices, ruleParts.dayRule, 'daylight', a.installedAppId, activeDevice?.id)}
                  />
                </RoomControlRule>
              )}
              {ruleParts.transitionRule && (
                <RoomControlRule
                  key={`rulepart-transition-${a.installedAppId}`}
                  gridLineName="rule-trans"
                >
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Transition Rule`}
                    ruleType="transition"
                    time={ruleParts.transitionRule.time.format('hA')}
                    isRuleActive={true}
                    isRuleEnabled={a.ruleSummary.enableTransitionRule && !a.ruleSummary.temporaryDisableTransitionRule}
                    isKeyRule={false}
                    setActiveDevice={setActiveDevice}
                  />
                </RoomControlRule>
              )}
              {ruleParts.nightRule && (
                <RoomControlRule
                  key={`rulepart-nightlight-${a.installedAppId}`}
                  gridLineName="rule-night"
                >
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Nightlight Rule`}
                    ruleType="nightlight"
                    time={`${ruleParts.nightRule.startTime.format('hA')} - ${ruleParts.nightRule.endTime.format('hA')}`}
                    isRuleActive={isRuleActive(ruleParts.nightRule.startTime, ruleParts.nightRule.endTime)}
                    isRuleEnabled={a.ruleSummary.enableNightlightRule && !a.ruleSummary.temporaryDisableNightlightRule}
                    isKeyRule={isRuleActive(ruleParts.nightRule.startTime, ruleParts.nightRule.endTime) && lockedDevices.length > 0}
                    setActiveDevice={setActiveDevice}
                    isLinkedActive={isLinkedRuleActive(ruleParts.nightRule, 'nightlight', a.installedAppId, activeDevice?.id)}
                    isLockedActive={isLockedRuleActive(lockedDevices, ruleParts.nightRule, 'nightlight', a.installedAppId, activeDevice?.id)}
                  />
                </RoomControlRule>
              )}
              {ruleParts.idleRule && (
                <RoomControlRule
                  key={`rulepart-idle-${a.installedAppId}`}
                  gridLineName="rule-idle"
                >
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Idle Rule`}
                    ruleType="idle"
                    time={ruleParts.idleRule.motionTimeout}
                    isRuleActive={true}
                    isRuleEnabled={a.ruleSummary.enableIdleRule && !a.ruleSummary.temporaryDisableIdleRule}
                    isKeyRule={false}
                    setActiveDevice={setActiveDevice}
                  />
                </RoomControlRule>
              )}
            </React.Fragment>
          );
        })}
        <RoomControlPower>
          <Power
            key={`power-${room.roomId!}`}
            room={room}
            isPowerOn={roomSwitches.some(s => s.value === 'on')}
            setActiveDevice={setActiveDevice}
          />
        </RoomControlPower>
        <RoomControlTitle>
          <RoomControlTitleText>
            {roomName}
          </RoomControlTitleText>
        </RoomControlTitle>
        <RoomControlFavorite onClick={() => setFavoriteRoom(room.roomId!)}>
          {!!roomFloor && (
            <RoomControlTitleFloor>
              {roomFloor}
            </RoomControlTitleFloor>
          )}
          {isFavoriteRoom ? '🌟' : '⭐'}
        </RoomControlFavorite>
        <RoomControlDeviceLabel>
          {activeDevice?.name}
        </RoomControlDeviceLabel>
      </RoomControlGrid>
    </RoomContainer>
  );
};

export interface IRoomProps {
  room: IRoom;
  isFavoriteRoom: boolean;
  setFavoriteRoom: (roomId: string) => void;
}

export default Room;
