import React from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import {useLocalStorage} from 'usehooks-ts';
import global from '../constants/global';
import {DashboardSubTitle, DashboardTitle} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import {useLocationContextStore} from '../store/LocationContextStore';
import DeviceControls from './DeviceControls';
import LocationRequiredHint from './LocationRequiredHint';
import Room from './Room';

const DashboardRoomSplit = styled.div`
  display: grid;
  grid-template-areas:
    "header header subheader"
    "controls rooms rooms";
  /* the split fills .main-content and its second row takes the rest of the height, so the controls column and the room
     grid both reach the bottom of the screen and only the room grid scrolls. minmax(0, ...) lets that row and the rooms
     column shrink below their content instead of pushing the page taller or wider */
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  gap: ${global.measurements.dashboardGridGap};
  height: 100%;
  min-height: 0;
  /* clip, not hidden - a favorite room's scrollIntoView can still scroll a hidden container, which slid the controls off screen */
  overflow: clip;
`;

// left sidebar, always - not worth the complexity of collapsing to a bottom bar for narrow phones. it stays in view
// because only the room grid beside it scrolls
const DeviceControlsGridContainer = styled.div`
  grid-area: controls;
  min-height: 0;
`;

const DashboardRoomGrid = styled.div<{roomCount: number}>`
  grid-area: rooms;
  display: grid;
  gap: ${global.measurements.dashboardGridGap};
  /* cards never shrink below the width that fits a full row of devicesPerRow tiles (see global.measurements.minRoomSize),
     unless the screen is too narrow for even one such card beside the controls - then a card takes the full width and
     its tiles wrap to fewer per row */
  grid-template-columns: repeat(auto-fill, minmax(min(${global.measurements.minRoomSize}, 100%), 1fr));
  /* cards stretch (the grid default) to match the tallest card in their row, so every row reads as a clean,
     uniform strip - RoomCard is a flex column with no justify-content override, so its own content still packs
     to the top, and any leftover height just becomes empty space at the bottom of the shorter cards */
  min-height: 0;
  overflow: auto;
  /* the last row's cards otherwise sit flush against the bottom edge of the screen */
  padding-bottom: ${global.measurements.dashboardGridGap};
`;

const DashboardRooms: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [favoriteRoom, setFavoriteRoom] = useLocalStorage<string>('favorite-room', '');
  const locationName = useLocationContextStore(s => s.locationName);

  if (!deviceData.locationId) {
    return <LocationRequiredHint sectionName={t('dashboard.room.sectionName')} />;
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
