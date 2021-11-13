import {Room as IRoom} from '@smartthings/core-sdk';
import React from 'react';
import styled from 'styled-components';
import {useLocalStorage} from 'use-hooks';
import {IResponseSmartApp} from '../operations/getInstalledSmartApp';
import Device from './Device';

const RoomTitle = styled.div`
    font-size: larger;
    font-weight: 700;
`;

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

const RoomDeviceGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    grid-auto-columns: 1fr;
    grid-auto-rows: 1fr;
`;

const Room: React.FC<IRoomProps> = ({room}) => {
  const [dashboardData] = useLocalStorage('smartAppState', {} as IResponseSmartApp);
  const roomSwitches = dashboardData.switches.filter(d => d.roomId === room.roomId);
  const roomLocks = dashboardData.locks.filter(d => d.roomId === room.roomId);
  const roomMotion = dashboardData.motion.filter(d => d.roomId === room.roomId);

  return (
    <RoomContainer>
      <RoomTitle>
        {room.name}
      </RoomTitle>
      <RoomDeviceGrid>
        {roomSwitches.map(s => (
          <Device
            key={`switch-${s.deviceId as string}`}
            device={s}
            deviceType="Switch"
          />
        ))}
        {roomLocks.map(s => (
          <Device
            key={`lock-${s.deviceId as string}`}
            device={s}
            deviceType="Lock"
          />
        ))}
        {roomMotion.map(s => (
          <Device
            key={`motion-${s.deviceId as string}`}
            device={s}
            deviceType="Motion"
          />
        ))}
      </RoomDeviceGrid>
    </RoomContainer>
  );
};

export interface IRoomProps {
  room: IRoom;
}

export default Room;