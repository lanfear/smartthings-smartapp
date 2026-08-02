import React from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import {useLocalStorage} from 'usehooks-ts';
import global from '../constants/global';
import {DashboardSubTitle, DashboardTitle} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import {useLocationContextStore} from '../store/LocationContextStore';
import DeviceControls from './DeviceControls';
import Room from './Room';

const DashboardRoomSplit = styled.div`
  display: grid;
  grid-template-areas:
    "header header subheader"
    "controls rooms rooms";
  grid-template-columns: auto 1fr;
  gap: ${global.measurements.dashboardGridGap};
  overflow: hidden;
`;

// sticky left sidebar, always - not worth the complexity of collapsing to a bottom bar for narrow phones
const DeviceControlsGridContainer = styled.div`
  grid-area: controls;
  position: sticky;
  top: 0;
`;

const DashboardRoomGrid = styled.div<{roomCount: number}>`
  grid-area: rooms;
  display: grid;
  gap: ${global.measurements.dashboardGridGap};
  grid-template-columns: repeat(auto-fill, minmax(312px, 1fr));
  /* one of these should work, but is not, hardcoding 312px for now, come back later */
  /* grid-template-columns: repeat(auto-fill, 1fr); */
  /* grid-template-columns: repeat(auto-fill, minmax(auto, 1fr)); */
  /* cards stretch (the grid default) to match the tallest card in their row, so every row reads as a clean,
     uniform strip - RoomCard is a flex column with no justify-content override, so its own content still packs
     to the top, and any leftover height just becomes empty space at the bottom of the shorter cards */
  flex-grow: 1;
  overflow: auto;
`;

const DashboardRooms: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [favoriteRoom, setFavoriteRoom] = useLocalStorage<string>('favorite-room', '');
  const locationName = useLocationContextStore(s => s.locationName);

  if (!deviceData.locationId) {
    return null;
  }

  return (
    <DashboardRoomSplit>
      <DashboardTitle style={{
        gridArea: 'header'
      }}
      >
        {t('dashboard.room.sectionName')}
      </DashboardTitle>
      <DashboardSubTitle style={{
        gridArea: 'subheader'
      }}
      >
        {`${locationName}: ${deviceData.locationId}`}
      </DashboardSubTitle>
      <DeviceControlsGridContainer
        className="device-controls-grid-container"
      >
        <DeviceControls />
      </DeviceControlsGridContainer>
      <DashboardRoomGrid roomCount={deviceData.rooms.length || 0}>
        {deviceData.rooms.map(r => (
          <Room
            key={`room-${r.roomId!}`}
            roomId={r.roomId!}
            isFavoriteRoom={favoriteRoom === r.roomId}
            setFavoriteRoom={setFavoriteRoom}
          />
        ))}
      </DashboardRoomGrid>
    </DashboardRoomSplit>
  );
};

export default DashboardRooms;
