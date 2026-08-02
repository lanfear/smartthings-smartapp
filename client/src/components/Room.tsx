import dayjs, {type Dayjs} from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import React, {useEffect, useRef} from 'react';
import {useEventSource, useEventSourceListener} from 'react-sse-hooks';
import styled from 'styled-components';
import {useLocalStorage} from 'usehooks-ts';
import global from '../constants/global';
import {createControlGradient, GlassPanel, GlassPill} from '../factories/styleFactory';
import getRulesFromSummary, {type IRuleIdle, type IRuleRange, type IRuleTransition} from '../operations/getRulesFromSummary';
import {getSceneRoomIds, setDeviceDataForLocation, useDeviceData} from '../store/DeviceContextStore';
import type {IActiveControl} from '../types/interfaces';
import type {DeviceContext, IApp, IDevice, ISseEvent} from '../types/sharedContracts';
import Device from './Device';
import Power from './Power';
import Rule from './Rule';
import Scene from './Scene';
import SmartApp from './SmartApp';

dayjs.extend(isBetween);

const isRuleActive = (startTime: Dayjs, endTime: Dayjs): boolean => dayjs().isBetween(startTime, endTime);

const isLinkedRuleSetActive = (ruleSetId: string, activeDeviceId?: string): boolean => !!activeDeviceId && activeDeviceId === ruleSetId;

const isLinkedRuleActive = (rule: IRuleRange, rulePart: string, ruleBaseId: string, activeDeviceId?: string): boolean => !!activeDeviceId && (
  rule.controlDevice.deviceId === activeDeviceId
    || Object.values(rule.switchDevices).some(d => d.deviceId === activeDeviceId)
    || activeDeviceId.endsWith(`${rulePart.toLowerCase()}-${ruleBaseId}`)
);

const isLockedRuleActive = (lockedDevices: IDevice[], rule: IRuleRange, rulePart: string, ruleBaseId: string, activeDeviceId?: string): boolean =>
  !!activeDeviceId && (
    rule.controlDevice.deviceId === activeDeviceId || (
      lockedDevices.length > 0
      && isRuleActive(rule.startTime, rule.endTime)
      && activeDeviceId.endsWith(`${rulePart.toLowerCase()}-${ruleBaseId}`)
    )
  );

const isLinkedDeviceActive = (roomRuleSummaries: Record<string, {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle}>, deviceId: string, activeDeviceId?: string): boolean =>
  !!activeDeviceId && (
    (deviceId === activeDeviceId)
    || Object.entries(roomRuleSummaries).some(([k, v]) => (
      (activeDeviceId.endsWith(`daylight-${k}`) && v.dayRule
        && (v.dayRule.controlDevice.deviceId === deviceId || Object.values(v.dayRule.switchDevices).some(d => d.deviceId === deviceId)))
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      || (activeDeviceId.endsWith(`nightlight-${k}`) && v.nightRule
        && (v.nightRule.controlDevice.deviceId === deviceId || Object.values(v.nightRule.switchDevices).some(d => d.deviceId === deviceId)))
    )));

const isLockedDeviceActive = (lockedDevices: IDevice[], roomRuleSummaries: Record<string, {dayRule?: IRuleRange; nightRule?: IRuleRange; transitionRule?: IRuleTransition; idleRule?: IRuleIdle}>, deviceId: string, activeDeviceId?: string): boolean =>
  !!activeDeviceId && (
    (lockedDevices.some(d => d.deviceId === deviceId) && deviceId === activeDeviceId)
    || (Object.entries(roomRuleSummaries).some(([k, v]) =>
      ((activeDeviceId.endsWith(`daylight-${k}`) && v.dayRule?.controlDevice.deviceId === deviceId && isRuleActive(v.dayRule.startTime, v.dayRule.endTime))
       || (activeDeviceId.endsWith(`nightlight-${k}`) && v.nightRule?.controlDevice.deviceId === deviceId && isRuleActive(v.nightRule.startTime, v.nightRule.endTime)))))
  );

// the room card itself - a responsive tile grid replaces the old fixed 5-column named-grid layout, so it can
// go single/double-column on a narrow phone and spread across many more tiles per row on a wide screen
const RoomCard = styled(GlassPanel)`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem;
`;

const RoomHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RoomHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  flex: 1;
`;

const RoomControlTitleText = styled(GlassPill)`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RoomControlTitleFloor = styled.span`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  background: ${createControlGradient(global.palette.control.rgb.floor)};
  box-shadow: ${global.shadows.badge};
  border-radius: ${global.borderRadius.circle};
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  font-weight: 700;
  color: #000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  transition: ${global.transitions.smooth};

  &:hover {
    transform: scale(1.05);
    box-shadow: ${global.shadows.badgeHover};
  }
`;

const RoomFavoriteButton = styled.button`
  all: unset;
  flex: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1.15rem;
  transition: ${global.transitions.smooth};
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));

  &:hover {
    transform: scale(1.15) translateY(-2px);
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  }

  &:active {
    transform: scale(1.05);
  }
`;

const RoomStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${global.measurements.deviceWidth}, 1fr));
  gap: ${global.measurements.deviceGridGap};
  justify-items: center;
`;

// there is no difference between these 3 styles, but we declare them uniquely for future differentiation
const RoomTileGrid = styled(RoomStrip)``;
const RoomRuleStrip = styled(RoomStrip)``;
const RoomSceneStrip = styled(RoomStrip)``;

const RoomActiveLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 1.25rem;
  font-size: 0.8rem;
  opacity: 0.75;
`;

const Room: React.FC<IRoomProps> = ({roomId, isFavoriteRoom, setFavoriteRoom}) => {
  const localStorageKey = `smartAppRoom-${roomId}-activeDevice`;
  const room = useDeviceData(d => d.rooms.find(r => r.roomId === roomId))!;
  const deviceData = useDeviceData();
  const [activeDevice, setActiveDevice] = useLocalStorage(localStorageKey, null as IActiveControl | null);
  const domRef = useRef<HTMLDivElement>(null);

  const roomSwitches = deviceData.switches.filter(d => d.roomId === room.roomId);
  const roomLocks = deviceData.locks.filter(d => d.roomId === room.roomId);
  const roomMotion = deviceData.motion.filter(d => d.roomId === room.roomId);
  const roomScenes = deviceData.scenes.filter(s => getSceneRoomIds(s).includes(room.roomId!));

  const findAppsForRoom = (): IApp[] => {
    const iRoomApps = deviceData.apps.filter(a => a.ruleSummary.motionSensors.some((m: DeviceContext) => roomMotion.some(rm => rm.deviceId === m.deviceId)));
    return iRoomApps;
  };

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

  const lockedDevices = roomSwitches.filter(r => activeRuleControlSwitches.some(did => r.deviceId === did.deviceId));

  const deviceEventSource = useEventSource({
    source: `${process.env.SMARTAPP_BUILDTIME_APIHOST}/events`
  });

  const roomParts = room.name!.split(' - ');
  const roomName = roomParts.length > 1 ? roomParts[1] : roomParts[0];
  const roomFloor = roomParts.length > 1 ? roomParts[0] : null;

  const handleSwitchDeviceEvent = async (eventData: ISseEvent): Promise<void> => {
    const targetDevice = roomSwitches.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      await setDeviceDataForLocation(deviceData.locationId, {...deviceData});
    }
  };

  const handleLockDeviceEvent = async (eventData: ISseEvent): Promise<void> => {
    const targetDevice = roomLocks.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      await setDeviceDataForLocation(deviceData.locationId, {...deviceData});
    }
  };

  const handleMotionDeviceEvent = async (eventData: ISseEvent): Promise<void> => {
    const targetDevice = roomMotion.find(s => s.deviceId === eventData.deviceId);
    if (targetDevice) {
      targetDevice.value = eventData.value;
      await setDeviceDataForLocation(deviceData.locationId, {...deviceData});
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
    <RoomCard ref={domRef}>
      <RoomHeader>
        <RoomHeaderTitle>
          {!!roomFloor && (
            <RoomControlTitleFloor>
              {roomFloor}
            </RoomControlTitleFloor>
          )}
          <RoomControlTitleText>
            {roomName}
          </RoomControlTitleText>
        </RoomHeaderTitle>
        <RoomFavoriteButton onClick={() => setFavoriteRoom(roomId)}>
          {isFavoriteRoom ? '🌟' : '⭐'}
        </RoomFavoriteButton>
      </RoomHeader>
      <RoomTileGrid>
        <Power
          key={`power-${room.roomId!}`}
          room={room}
          isPowerOn={roomSwitches.some(s => s.value === 'on')}
          setActiveDevice={setActiveDevice}
        />
        {roomSwitches.map(s => (
          <Device
            key={`switch-${s.deviceId}`}
            device={s}
            deviceType="Switch"
            setActiveDevice={setActiveDevice}
            isLocked={lockedDevices.some(d => d.deviceId === s.deviceId)}
            isLinkedActive={isLinkedDeviceActive(roomRuleSummaries, s.deviceId, activeDevice?.id)}
            isLockedActive={isLockedDeviceActive(lockedDevices, roomRuleSummaries, s.deviceId, activeDevice?.id)}
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
      </RoomTileGrid>
      {roomScenes.length > 0 && (
        <RoomSceneStrip>
          {roomScenes.map(s => (
            <Scene
              key={`scene-${s.sceneId!}`}
              scene={s}
              locationId={deviceData.locationId}
            />
          ))}
        </RoomSceneStrip>
      )}
      {roomApps.length > 0 && (
        <RoomRuleStrip>
          {roomApps.map(a => {
            const ruleParts = getRulesFromSummary(a.ruleSummary);

            return (
              <React.Fragment key={`rulesection-${a.installedAppId}`}>
                <SmartApp
                  app={a}
                  isRuleEnabled={true}
                  setActiveDevice={setActiveDevice}
                />
                {ruleParts.dayRule && (
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Daylight Rule`}
                    ruleType="daylight"
                    time={`${ruleParts.dayRule.startTime.format('hA')} - ${ruleParts.dayRule.endTime.format('hA')}`}
                    isRuleActive={isRuleActive(ruleParts.dayRule.startTime, ruleParts.dayRule.endTime)}
                    isRuleEnabled={a.ruleSummary.enableDaylightRule && !a.ruleSummary.tempDisableDaylightRule}
                    isKeyRule={isRuleActive(ruleParts.dayRule.startTime, ruleParts.dayRule.endTime) && lockedDevices.length > 0}
                    setActiveDevice={setActiveDevice}
                    isLinkedActive={isLinkedRuleActive(ruleParts.dayRule, 'daylight', a.installedAppId, activeDevice?.id) || isLinkedRuleSetActive(a.installedAppId, activeDevice?.id)}
                    isLockedActive={isLockedRuleActive(lockedDevices, ruleParts.dayRule, 'daylight', a.installedAppId, activeDevice?.id)}
                  />
                )}
                {ruleParts.transitionRule && (
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Transition Rule`}
                    ruleType="transition"
                    time={ruleParts.transitionRule.time.format('hA')}
                    isRuleActive={true}
                    isRuleEnabled={a.ruleSummary.enableTransitionRule && !a.ruleSummary.tempDisableTransitionRule}
                    isKeyRule={false}
                    setActiveDevice={setActiveDevice}
                    isLinkedActive={isLinkedRuleSetActive(a.installedAppId, activeDevice?.id)}
                  />
                )}
                {ruleParts.nightRule && (
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Nightlight Rule`}
                    ruleType="nightlight"
                    time={`${ruleParts.nightRule.startTime.format('hA')} - ${ruleParts.nightRule.endTime.format('hA')}`}
                    isRuleActive={isRuleActive(ruleParts.nightRule.startTime, ruleParts.nightRule.endTime)}
                    isRuleEnabled={a.ruleSummary.enableNightlightRule && !a.ruleSummary.tempDisableNightlightRule}
                    isKeyRule={isRuleActive(ruleParts.nightRule.startTime, ruleParts.nightRule.endTime) && lockedDevices.length > 0}
                    setActiveDevice={setActiveDevice}
                    isLinkedActive={isLinkedRuleActive(ruleParts.nightRule, 'nightlight', a.installedAppId, activeDevice?.id) || isLinkedRuleSetActive(a.installedAppId, activeDevice?.id)}
                    isLockedActive={isLockedRuleActive(lockedDevices, ruleParts.nightRule, 'nightlight', a.installedAppId, activeDevice?.id)}
                  />
                )}
                {ruleParts.idleRule && (
                  <Rule
                    rulePartId={a.installedAppId}
                    ruleName={`${a.displayName!} Idle Rule`}
                    ruleType="idle"
                    time={ruleParts.idleRule.motionTimeout}
                    isRuleActive={true}
                    isRuleEnabled={a.ruleSummary.enableIdleRule && !a.ruleSummary.tempDisableIdleRule}
                    isKeyRule={false}
                    setActiveDevice={setActiveDevice}
                    isLinkedActive={isLinkedRuleSetActive(a.installedAppId, activeDevice?.id)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </RoomRuleStrip>
      )}
      <RoomActiveLabel>
        {activeDevice?.name}
      </RoomActiveLabel>
    </RoomCard>
  );
};

export interface IRoomProps {
  roomId: string;
  isFavoriteRoom: boolean;
  setFavoriteRoom: (roomId: string) => void;
}

export default Room;
