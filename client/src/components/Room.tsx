import {Room as IRoom} from '@smartthings/core-sdk';
import React from 'react';
import styled from 'styled-components';
import {useLocalStorage} from 'use-hooks';
import {IResponseSmartApp} from '../operations/getInstalledSmartApp';
import {IDevice} from '../types/smartthingsExtensions';
import Device from './Device';
import Power from './Power';

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
  const [dashboardData] = useLocalStorage('smartAppState', {} as IResponseSmartApp);
  const [activeDevice, setActiveDevice] = useLocalStorage(`smartAppRoom-${room.roomId as string}-activeDevice`, null as IDevice|null);
  const roomSwitches = dashboardData.switches.filter(d => d.roomId === room.roomId);
  const roomLocks = dashboardData.locks.filter(d => d.roomId === room.roomId);
  const roomMotion = dashboardData.motion.filter(d => d.roomId === room.roomId);

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
              key={`switch-${s.deviceId as string}`}
              device={s}
              deviceType="Switch"
              setActiveDevice={setActiveDevice}
            />
          ))}
          {roomLocks.map(s => (
            <Device
              key={`lock-${s.deviceId as string}`}
              device={s}
              deviceType="Lock"
              setActiveDevice={setActiveDevice}
            />
          ))}
          {roomMotion.map(s => (
            <Device
              key={`motion-${s.deviceId as string}`}
              device={s}
              deviceType="Motion"
              setActiveDevice={setActiveDevice}
            />
          ))}
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