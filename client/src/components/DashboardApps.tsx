import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import {DashboardTitle, DashboardSubTitle, DashboardGridColumnHeader} from '../constants/styles';
import {useDeviceContext} from '../store/DeviceContextStore';

const DashboardAppGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardApps: React.FC = () => {
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
        {t('dashboard.installedApp.sectionName')}
      </DashboardSubTitle>
      <DashboardAppGrid>
        <DashboardGridColumnHeader>
          {t('dashboard.installedApp.header.name')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.installedApp.header.ruleId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.installedApp.header.status')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.installedApp.header.ownerId')}
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

export default DashboardApps;
