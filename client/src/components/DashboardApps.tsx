import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, DashboardSubTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceData} from '../store/DeviceContextStore';
import getLocations from '../operations/getLocations';
import {setLocation} from '../store/LocationContextStore';
import {RouteParams} from '../App';

const DashboardAppGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardApps: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceData();
  const {locationId} = useParams<RouteParams>();

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
