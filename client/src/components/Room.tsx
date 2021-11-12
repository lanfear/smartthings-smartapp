import {Room as IRoom} from '@smartthings/core-sdk';
import React from 'react';
import styled from 'styled-components';

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

const RoomComponent: React.FC<IRoomProps> = ({Room: RoomProp}) => (
  <RoomContainer>
    <RoomTitle>
      {RoomProp.name}
    </RoomTitle>
    {/* <span>{t('dashboard.switch.header.RoomId')}: {Room.RoomId}</span> */}
    <RoomStatus>
      {RoomProp.roomId}
    </RoomStatus>
  </RoomContainer>
);

export interface IRoomProps {
  Room: IRoom;
}

export default RoomComponent;