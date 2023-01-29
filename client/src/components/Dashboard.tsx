import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {useDeviceContext} from '../store/DeviceContextStore';
import {DeviceContext, IRule} from '../types/sharedContracts';
import DeviceControls from './DeviceControls';
import Room from './Room';
import RuleControls from './RuleControls';

const gridRoomColumnCount = 3;

const DashboardTitle = styled.h2`
    font-weight: 600;
`;

const DashboardSubTitle = styled.h3`
    font-weight: 600;
`;

const DashboardRoomGrid = styled.div`
    display: grid;
    grid-template-columns: [device-control-start] max-content [device-control-end rooms-start] 1fr [rooms-end rule-control-start] max-content [rule-control-end] ;
    gap: 10px;
    // grid-auto-columns: 1fr;
    grid-auto-rows: 1fr;
`;

const DashboardSceneGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
`;

const DashboardRuleGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardAppGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardGridColumnHeader = styled.span`
    display: flex;
    justify-content: center;
`;

const RoomGridContainer = styled.div`
  grid-column: rooms-start / rooms-end;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  grid-auto-rows: 1fr;
  gap: 10px;
}`;

const DeviceControlsGridContainer = styled.div`
  grid-column: device-control-start / device-control-end;
`;

const RuleControlsGridContainer = styled.div`
  grid-column: rule-control-start / rule-control-end;
`;

const Dashboard: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceContext();

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? ''; // empty location id should not happen

  const deleteRule = async (location: string, ruleId: string): Promise<void> => {
    // TODO: remove the app/id/rule/id delete endpoint and add one that takes location
    await fetch(`${process.env.REACT_APP_APIHOST as string}/${location}/rule/${ruleId}`, {method: 'DELETE'});
  };

  const findRoomName = (rule: IRule): string | undefined => {
    const motionDevice = deviceData.motion.find(m =>
      rule.ruleSummary?.motionSensors.find((mm: DeviceContext): boolean => m.deviceId === mm.deviceId)
    );
    const room = deviceData.rooms.find(r => r.roomId === motionDevice?.roomId);
    return room?.name;
  };

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
            <Room room={r} />
          </RoomGridContainer>
        ))}
        <DeviceControlsGridContainer roomCount={deviceData?.rooms?.length || 0}>
          <DeviceControls />
        </DeviceControlsGridContainer>
        <RoomGridContainer>
          {renderedDashboardData && renderedDashboardData?.rooms?.map(r => (
            <Room
              room={r}
              key={`room-${r.roomId as string}`}
            />
          ))}
        </RoomGridContainer>
        <RuleControlsGridContainer>
          <RuleControls />
        </RuleControlsGridContainer>
      </DashboardRoomGrid>
      <DashboardSubTitle>
        {t('dashboard.scene.sectionName')}
      </DashboardSubTitle>
      <DashboardSceneGrid>
        <DashboardGridColumnHeader>
          {t('dashboard.scene.header.sceneName')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.scene.header.sceneId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.scene.header.createdBy')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.scene.header.createdDate')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.scene.header.lastExecutedDate')}
        </DashboardGridColumnHeader>
        {deviceData && deviceData?.scenes?.map(s => (
          <React.Fragment key={`scene-${s.sceneId as string}`}>
            <span>
              {s.sceneName}
            </span>
            <span>
              {s.sceneId}
            </span>
            <span>
              {s.createdBy}
            </span>
            <span>
              {s.createdDate}
            </span>
            <span>
              {s.lastExecutedDate}
            </span>
          </React.Fragment>
        ))}
      </DashboardSceneGrid>
      <DashboardRuleGrid>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.name')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.ruleId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.status')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.ownerId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.manage')}
        </DashboardGridColumnHeader>
        {deviceData && deviceData.rules?.map(s => (
          <React.Fragment key={`rules-${s.id}`}>
            <span>
              {s.name}
            </span>
            <span>
              {s.id}
            </span>
            <span>
              {s.executionLocation}
            </span>
            <span>
              {findRoomName(s)}
            </span>
            <button onClick={() => deleteRule(locationId, s.id)}>
            DELETE
            </button>
          </React.Fragment>
        ))}
      </DashboardRuleGrid>
      <DashboardAppGrid>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.name')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.ruleId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.status')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.ownerId')}
        </DashboardGridColumnHeader>
        {deviceData && deviceData.apps?.map(a => (
          <React.Fragment key={`apps-${a.installedAppId}`}>
            <span>
              {a.displayName}
            </span>
            <span>
              {a.appId}
            </span>
            <span>
              {a.installedAppId}
            </span>
            <span>
              {a.lastUpdatedDate}
            </span>
          </React.Fragment>
        ))}
      </DashboardAppGrid>
    </>
  );
};

export default Dashboard;
