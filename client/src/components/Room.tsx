import {Room as IRoom} from '@smartthings/core-sdk';
import React from 'react';
import styled from 'styled-components';
import {useLocalStorage} from 'use-hooks';
import {IResponseSmartApp} from '../operations/getInstalledSmartApp';

const RoomTitle = styled.div`
    font-size: larger;
    font-weight: 700;
`;

const RoomStatus = styled.div`
    font-size: smaller;
    font-weight: 500;
`;

const RoomContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: space-evenly;
    border: 1px solid gray;
    border-radius: 4px;
`;

const Room: React.FC<IRoomProps> = ({room}) => {
  const [dashboardData] = useLocalStorage('smartAppState', {} as IResponseSmartApp);
  const roomSwitches = dashboardData.switches.filter(d => d.roomId === room.roomId);

  return (
    <RoomContainer>
      <RoomTitle>
        {room.name}
      </RoomTitle>
      <RoomStatus>
        {room.roomId}
      </RoomStatus>
      {roomSwitches.map(s => (
        <span key={`switch-${s.deviceId as string}`}>
          {s.label}
        </span>
      ))}
    </RoomContainer>
  );
};

export interface IRoomProps {
  room: IRoom;
}

export default Room;