import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {useLocalStorage} from 'usehooks-ts';
import global from '../constants/global';
import {DashboardSubTitle, DashboardTitle, FlexRowCenter} from '../factories/styleFactory';
import {useDeviceData} from '../store/DeviceContextStore';
import DeviceControls from './DeviceControls';
import Room from './Room';
import {RouteParams} from '../App';
import getLocations from '../operations/getLocations';
import {setLocation} from '../store/LocationContextStore';

const DashboardRoomSplit = styled(FlexRowCenter)`
  align-items: unset;
  overflow: hidden;
`;

// grid-row constraint set in generated grid class mediaquery statement above
const DeviceControlsGridContainer = styled.div`
  position: sticky;
  top: 0;
`;

const DashboardRoomGrid = styled.div<{roomCount: number}>`
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
  const {deviceData} = useDeviceData();
  const [favoriteRoom, setFavoriteRoom] = useLocalStorage<string>('favorite-room', '');

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
    <>
      <DashboardTitle>
        {locationId}
      </DashboardTitle>
      <DashboardSubTitle>
        {t('dashboard.room.sectionName')}
      </DashboardSubTitle>
      <DashboardRoomSplit>
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
    </>
  );
};

export default DashboardRooms;
