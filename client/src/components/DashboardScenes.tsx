import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import {
  DashboardTitle,
  DashboardSubTitle,
  DashboardCardGrid,
  DashboardCard,
  DashboardCardTitle,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue,
  DashboardCardActions,
  DashboardActionButton,
  DashboardChipToggle
} from '../factories/styleFactory';
import executeScene from '../operations/executeScene';
import setSceneRooms from '../operations/setSceneRooms';
import {getSceneRoomIds, revalidateDeviceDataForLocation, useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import type {IRoom} from '../types/sharedContracts';

const RoomChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

// rooms are named 'Floor - Room' throughout this app (see Room.tsx) - keep the chip label just the room part
const getRoomDisplayName = (room: IRoom): string => {
  const roomParts = room.name!.split(' - ');
  return roomParts.length > 1 ? roomParts[1] : roomParts[0];
};

const DashboardScenes: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [executingSceneId, setExecutingSceneId] = useState<string | null>(null);

  if (!deviceData.locationId) {
    return null;
  }

  const handleExecuteScene = async (sceneId: string): Promise<void> => {
    setExecutingSceneId(sceneId);
    try {
      await executeScene(deviceData.locationId, sceneId);
      await revalidateDeviceDataForLocation(deviceData.locationId);
    } finally {
      setExecutingSceneId(null);
    }
  };

  const handleToggleSceneRoom = async (sceneId: string, roomId: string, currentRoomIds: string[]): Promise<void> => {
    const nextRoomIds = currentRoomIds.includes(roomId) ? currentRoomIds.filter(id => id !== roomId) : [...currentRoomIds, roomId];
    await setSceneRooms(deviceData.locationId, sceneId, nextRoomIds);
    await revalidateDeviceDataForLocation(deviceData.locationId);
  };

  return (
    <>
      <DashboardTitle>
        {t('dashboard.scene.sectionName')}
      </DashboardTitle>
      <DashboardSubTitle>
        {deviceData.locationId}
      </DashboardSubTitle>
      <DashboardCardGrid>
        {deviceData.scenes.map(s => (
          <DashboardCard key={`scene-${s.sceneId!}`}>
            <DashboardCardTitle>
              {s.sceneName}
            </DashboardCardTitle>
            <DashboardCardBody>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.sceneId')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.sceneId}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.createdBy')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.createdBy}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.createdDate')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.createdDate}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.lastExecutedDate')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.lastExecutedDate}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardFieldLabel>
                {t('dashboard.scene.header.rooms')}
              </DashboardCardFieldLabel>
              <RoomChipRow>
                {deviceData.rooms.map(r => {
                  const currentRoomIds = getSceneRoomIds(s);
                  const selected = currentRoomIds.includes(r.roomId!);
                  return (
                    <DashboardChipToggle
                      key={`scene-room-${s.sceneId!}-${r.roomId!}`}
                      selected={selected}
                      rgb={global.palette.control.rgb.scene}
                      onClick={() => {
                        void handleToggleSceneRoom(s.sceneId!, r.roomId!, currentRoomIds);
                      }}
                    >
                      {getRoomDisplayName(r)}
                    </DashboardChipToggle>
                  );
                })}
              </RoomChipRow>
            </DashboardCardBody>
            <DashboardCardActions>
              <DashboardActionButton
                rgb={global.palette.control.rgb.scene}
                disabled={executingSceneId === s.sceneId}
                onClick={() => {
                  void handleExecuteScene(s.sceneId!);
                }}
              >
                {executingSceneId === s.sceneId ? t('dashboard.scene.action.executing') : `▶ ${t('dashboard.scene.action.execute')}`}
              </DashboardActionButton>
            </DashboardCardActions>
          </DashboardCard>
        ))}
      </DashboardCardGrid>
    </>
  );
};

export default DashboardScenes;
