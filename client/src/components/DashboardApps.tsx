import React from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, DashboardSubTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';

const DashboardAppGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardApps: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();

  if (!deviceData.locationId) {
    return null;
  }

  return (
    <>
      <DashboardTitle>
        {deviceData.locationId}
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
        {deviceData.apps.map(a => (
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
