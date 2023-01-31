import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, DashboardSubTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceContext} from '../store/DeviceContextStore';

const DashboardSceneGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: ${global.measurements.dashboardGridGap};
`;

const DashboardScenes: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceContext();

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? ''; // empty location id should not happen

  return (
    <>
      <DashboardTitle>
        {locationId}
      </DashboardTitle>
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
    </>
  );
};

export default DashboardScenes;
