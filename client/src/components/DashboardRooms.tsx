import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {useLocalStorage} from 'use-hooks';
import global from '../constants/global';
import {DashboardSubTitle, DashboardTitle} from '../factories/styleFactory';
import {useDeviceContext} from '../store/DeviceContextStore';
import DeviceControls from './DeviceControls';
import Room from './Room';

const printColumnN = (n: number, columns: number): string => `
    .room-grid-container:nth-child(${columns}n${n !== columns ? `+${n}` : ''}) {
      grid-column: room-start ${n} / room-end ${n};
    }
  `;

const printColumns1ToN = (columns: number): string => {
  const iteratorArray: number[] = [];
  for (let i = 1; i <= columns; i++) {
    iteratorArray.push(i);
  }
  return iteratorArray
    .map(i => printColumnN(i, columns))
    .join('');
};

const printColumnBreakpoints = (roomCount: number): string => {
  const deviceControlsContainerWidth = parseFloat(global.measurements.controlsContainerWidth);
  const roomContainerWidth =
    (global.measurements.devicesPerRow * (parseFloat(global.measurements.deviceWidth) + (2 * parseFloat(global.measurements.deviceMargin)))) +
    ((global.measurements.devicesPerRow + 1) * parseFloat(global.measurements.deviceGridGap));

  // eslint-disable-next-line no-magic-numbers
  return [1, 2, 3, 4, 5].map(i => `
    ${i !== 1 ? `@media (min-width: ${deviceControlsContainerWidth + (i * roomContainerWidth)}rem) {` : ''}
      ${printColumns1ToN(i)}
      .device-controls-grid-container {
        grid-row: 1 / ${Math.ceil((roomCount / i) + 1)};
      }
    ${i !== 1 ? '}' : ''}
  `).join('');
};

const DashboardRoomGrid = styled.div<{roomCount: number}>`
    display: grid;
    grid-template-columns: [control-start] max-content [control-end] repeat(${props => props.roomCount}, [room-start] 1fr [room-end]);
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: 1fr;
    ${props => printColumnBreakpoints(props.roomCount)}
`;

// grid-row constraint set in generated grid class mediaquery statement above
const RoomGridContainer = styled.div`
`;

// grid-row constraint set in generated grid class mediaquery statement above
const DeviceControlsGridContainer = styled.div`
  grid-column: control-start / control-end;
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
      <DashboardRoomGrid roomCount={deviceData.rooms.length || 0}>
        {deviceData && deviceData.rooms.map(r => (
          <RoomGridContainer
            key={`room-${r.roomId!}`}
            className="room-grid-container"
          >
            <Room
              room={r}
              isFavoriteRoom={favoriteRoom === r.roomId}
              setFavoriteRoom={setFavoriteRoom}
            />
          </RoomGridContainer>
        ))}
        <DeviceControlsGridContainer
          className="device-controls-grid-container"
        >
          <DeviceControls />
        </DeviceControlsGridContainer>
      </DashboardRoomGrid>
    </>
  );
};

export default DashboardRooms;
