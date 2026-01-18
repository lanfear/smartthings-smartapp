import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {useLocalStorage} from 'usehooks-ts';
import type {RouteParams} from '../App';
import global from '../constants/global';
import {DashboardSubTitle, DashboardTitle} from '../factories/styleFactory';
import getLocations from '../operations/getLocations';
import {useDeviceStore} from '../store/DeviceContextStore';
import {setLocation, useLocationContextStore} from '../store/LocationContextStore';
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

// grid-row constraint set in generated grid class mediaquery statement above
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
  flex-grow: 1;
  overflow: auto;
`;

const DashboardRooms: React.FC = () => {
  const {locationId} = useParams<RouteParams>();
  const {t} = useTranslation();
  const {deviceData} = useDeviceStore();
  const [favoriteRoom, setFavoriteRoom] = useLocalStorage<string>('favorite-room', '');
  const locationName = useLocationContextStore(s => s.locationName);

  // if you nav directly to location we have to setup location (itd be nice not to do this in each of the 4 components)
  useEffect(() => {
    if (locationId && locationId !== deviceData.locationId) {
      void (async () => {
        const locationData = (await getLocations()).find(l => l.locationId === locationId);
        if (locationData) {
          setLocation(locationId, locationData.name);
        }
      })();
    }
  }, [locationId, deviceData.locationId]);

  if (!locationId) {
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
        {`${locationName}: ${locationId}`}
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
            room={r}
            isFavoriteRoom={favoriteRoom === r.roomId}
            setFavoriteRoom={setFavoriteRoom}
          />
        ))}
      </DashboardRoomGrid>
    </DashboardRoomSplit>
  );
};

export default DashboardRooms;
