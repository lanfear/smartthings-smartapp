import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import {useParams} from 'react-router-dom';
import {useLocalStorage} from 'use-hooks';
import {Room as IRoom, SceneSummary} from '@smartthings/core-sdk';
import {IDevice} from '../types/smartthingsExtensions';
import Room from './Room';
import {DeviceContextStore} from '../store/DeviceContextStore';
import getLocationData, {IResponseLocation} from '../operations/getLocation';

const filteredRooms = ['DO NOT USE'];

const DashboardTitle = styled.h2`
    font-weight: 600;
`;

const DashboardSubTitle = styled.h3`
    font-weight: 600;
`;

const DashboardRoomGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    grid-auto-columns: 1fr;
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

const DashboardGridColumnHeader = styled.span`
    display: flex;
    justify-content: center;
`;

const Dashboard: React.FC = () => {
  const {t} = useTranslation();

  const [dashboardData, setDashboardData] = useLocalStorage('locationData', {} as IResponseLocation);

  const routeInfo = useParams<{ installedAppId: string }>();
  const installedAppId = routeInfo.installedAppId ?? '';

  const sortRoom = (r: IRoom, l: IRoom): 1 | -1 | 0 => {
    const rName = r.name?.toUpperCase() ?? ''; // ignore upper and lowercase
    const lName = l.name?.toUpperCase() ?? ''; // ignore upper and lowercase
    return rName < lName ? -1 : rName > lName ? 1 : 0;
  };

  const sortLabel = (r: IDevice, l: IDevice): 1 | -1 | 0 => {
    const rName = r.label?.toUpperCase() ?? ''; // ignore upper and lowercase
    const lName = l.label?.toUpperCase() ?? ''; // ignore upper and lowercase
    return rName < lName ? -1 : rName > lName ? 1 : 0;
  };

  const sortScene = (r: SceneSummary, l: SceneSummary): 1 | -1 | 0 => {
    const rName = r.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
    const lName = l.sceneName?.toUpperCase() ?? ''; // ignore upper and lowercase
    return rName < lName ? -1 : rName > lName ? 1 : 0;
  };

  useEffect(() => {
    const getDashboard = async (locationId: string): Promise<void> => {
      const locationData = await getLocationData(locationId);
      locationData.rooms = locationData.rooms?.sort(sortRoom).filter(r => !filteredRooms.includes(r.name as string)) ?? [];
      locationData.scenes = locationData.scenes?.sort(sortScene) ?? [];
      locationData.switches = locationData.switches?.sort(sortLabel) ?? [];
      locationData.locks = locationData.locks?.sort(sortLabel) ?? [];
      locationData.motion = locationData.motion?.sort(sortLabel) ?? [];
      setDashboardData(locationData);
    };

    void getDashboard(installedAppId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ignore installedAppId

  const deleteRule = async (isaId: string, ruleId: string): Promise<void> => {
    await fetch(`${process.env.REACT_APP_APIHOST as string}/app/${isaId}/rule/${ruleId}`, {method: 'DELETE'});
  };

  return (
    <DeviceContextStore value={{deviceData: dashboardData, setDeviceData: setDashboardData}}>
      <DashboardTitle>
        {dashboardData.locationId}
      </DashboardTitle>
      <DashboardSubTitle>
        {t('dashboard.room.sectionName')}
      </DashboardSubTitle>
      <DashboardRoomGrid>
        {dashboardData && dashboardData?.rooms?.map(r => (
          <React.Fragment key={`room-${r.roomId as string}`}>
            <Room room={r} />
          </React.Fragment>
        ))}
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
        {dashboardData && dashboardData?.scenes?.map(s => (
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
        {dashboardData && dashboardData.rules?.map(s => (
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
              {s.ownerId}
            </span>
            <button onClick={() => deleteRule(installedAppId, s.id)}>
              DELETE
            </button>
          </React.Fragment>
        ))}
      </DashboardRuleGrid>
    </DeviceContextStore>
  );
};

export default Dashboard;