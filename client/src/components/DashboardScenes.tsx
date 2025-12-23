import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, DashboardSubTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceData} from '../store/DeviceContextStore';
import {RouteParams} from '../App';
import getLocations from '../operations/getLocations';
import {setLocation} from '../store/LocationContextStore';

const DashboardSceneGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: ${global.measurements.dashboardGridGap};
`;

const DashboardScenes: React.FC = () => {
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
        {deviceData.scenes.map(s => (
          <React.Fragment key={`scene-${s.sceneId!}`}>
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
