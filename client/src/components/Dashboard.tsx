import {Device, Room as IRoom, SceneSummary} from '@smartthings/core-sdk';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import useSWR, {unstable_serialize as swrKeySerializer} from 'swr';
import getLocation from '../operations/getLocation';
import {DeviceContextStore} from '../store/DeviceContextStore';
import {DeviceContext, IResponseLocation, IRule} from '../types/sharedContracts';
import DeviceControls from './DeviceControls';
import Room from './Room';
import RuleControls from './RuleControls';

const filteredRooms = ['DO NOT USE'];

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

const initialDashboardData: IResponseLocation = {
  locationId: '',
  rooms: [],
  scenes: [],
  switches: [],
  locks: [],
  motion: [],
  rules: [],
  apps: []
};

const sortRoom = (r: IRoom, l: IRoom): 1 | -1 | 0 => {
  const rName = r.name?.toUpperCase() ?? ''; // ignore upper and lowercase
  const lName = l.name?.toUpperCase() ?? ''; // ignore upper and lowercase
  return rName < lName ? -1 : rName > lName ? 1 : 0;
};

const sortLabel = (r: Device, l: Device): 1 | -1 | 0 => {
  const rName = r.label?.toUpperCase() ?? ''; // ignore upper and lowercase
  const lName = l.label?.toUpperCase() ?? ''; // ignore upper and lowercase
  return rName < lName ? -1 : rName > lName ? 1 : 0;
};

const sortScene = (r: SceneSummary, l: SceneSummary): 1 | -1 | 0 => {
  const rName = r.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
  const lName = l.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
  return rName < lName ? -1 : rName > lName ? 1 : 0;
};

const getDashboard = async (location: string): Promise<IResponseLocation> => {
  const locationData = await getLocation(location);
  locationData.rooms = locationData.rooms?.sort(sortRoom).filter(r => !filteredRooms.includes(r.name as string)) ?? [];
  locationData.scenes = locationData.scenes?.sort(sortScene) ?? [];
  locationData.switches = locationData.switches?.sort(sortLabel) ?? [];
  locationData.locks = locationData.locks?.sort(sortLabel) ?? [];
  locationData.motion = locationData.motion?.sort(sortLabel) ?? [];
  return locationData;
};

const getFallbackData = (locationId: string): IResponseLocation => {
  const localStorageData = localStorage.getItem(swrKeySerializer(['locationData', locationId]));
  return localStorageData ? JSON.parse(localStorageData) as IResponseLocation : {
    ...initialDashboardData,
    locationId
  };
};

const Dashboard: React.FC = () => {
  const {t} = useTranslation();

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? '';
  const {data: dashboardData, mutate: setDashboardData} = useSWR(['locationData', locationId], (_, l) => getDashboard(l), {
    revalidateOnMount: true,
    dedupingInterval: 5000,
    fallbackData: getFallbackData(locationId)
  });

  const deleteRule = async (location: string, ruleId: string): Promise<void> => {
    // TODO: remove the app/id/rule/id delete endpoint and add one that takes location
    await fetch(`${process.env.REACT_APP_APIHOST as string}/${location}/rule/${ruleId}`, {method: 'DELETE'});
  };

  const renderedDashboardData = dashboardData || initialDashboardData;

  const findRoomName = (rule: IRule): string | undefined => {
    const motionDevice = renderedDashboardData.motion.find(m =>
      rule.ruleSummary?.motionSensors.find((mm: DeviceContext): boolean => m.deviceId === mm.deviceId)
    );
    const room = renderedDashboardData.rooms.find(r => r.roomId === motionDevice?.roomId);
    return room?.name;
  };

  return (
    <DeviceContextStore value={{deviceData: renderedDashboardData, setDeviceData: setDashboardData}}>
      <DashboardTitle>
        {renderedDashboardData.locationId}
      </DashboardTitle>
      <DashboardSubTitle>
        {t('dashboard.room.sectionName')}
      </DashboardSubTitle>
      <DashboardRoomGrid>
        <DeviceControlsGridContainer>
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
        {renderedDashboardData && renderedDashboardData?.scenes?.map(s => (
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
        {renderedDashboardData && renderedDashboardData.rules?.map(s => (
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
        {renderedDashboardData && renderedDashboardData.apps?.map(a => (
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
    </DeviceContextStore>
  );
};

export default Dashboard;