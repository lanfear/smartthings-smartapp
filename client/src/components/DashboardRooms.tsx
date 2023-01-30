import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {useLocalStorage} from 'use-hooks';
import {DashboardSubTitle, DashboardTitle} from '../constants/styles';
import {useDeviceContext} from '../store/DeviceContextStore';
import DeviceControls from './DeviceControls';
import Room from './Room';

const gridRoomColumnCount = 3;

const DashboardRoomGrid = styled.div`
    display: grid;
    grid-template-columns: [control-start] max-content [control-end] repeat(3, [room-start] 1fr [room-end]);
    gap: 10px;
    // grid-auto-columns: 1fr;
    grid-auto-rows: 1fr;
`;

const RoomGridContainer = styled.div`
  &:nth-child(3n+1) {
    grid-column: room-start 1 / room-end 1;
  }
  &:nth-child(3n+2) {
    grid-column: room-start 2 / room-end 2;
  }
  &:nth-child(3n) {
    grid-column: room-start 3 / room-end 3;
  }
`;

const DeviceControlsGridContainer = styled.div<{roomCount: number}>`
  grid-column: control-start / control-end;
  grid-row: 1 / ${props => (props.roomCount / gridRoomColumnCount) + 1}
`;

const DashboardRooms: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceContext();
  const [favoriteRoom, setFavoriteRoom] = useLocalStorage<string>('favorite-room', '');

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? ''; // empty location id should not happen

  return (
    <>
      <DashboardTitle>
        {locationId}
      </DashboardTitle>
      <DashboardSubTitle>
        {t('dashboard.room.sectionName')}
      </DashboardSubTitle>
      <DashboardRoomGrid>
        {deviceData && deviceData?.rooms?.map(r => (
          <RoomGridContainer key={`room-${r.roomId as string}`}>
            <Room
              room={r}
              isFavoriteRoom={favoriteRoom === r.roomId}
              setFavoriteRoom={setFavoriteRoom}
            />
          </RoomGridContainer>
        ))}
        <DeviceControlsGridContainer roomCount={deviceData?.rooms?.length || 0}>
          <DeviceControls />
        </DeviceControlsGridContainer>
      </DashboardRoomGrid>
    </>
  );
};

export default DashboardRooms;
