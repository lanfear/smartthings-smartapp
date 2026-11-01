import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useLocation, useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle} from '../factories/styleFactory';
import {useLocationIdParam} from '../store/DeviceContextStore';
import {setLocation, useLocationContextStore} from '../store/LocationContextStore';
import HomeHouse from './HomeHouse';
import HomeWeather from './HomeWeather';
import LocationRequiredHint from './LocationRequiredHint';

// same scrolling column as the Climate page, so the weather and house tiles scroll together
const PageScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: 1rem;
`;

/**
 * Landing page ('/' and /dashboard/:locationId/home). With no location selected it's the choose-a-location hint; with
 * one selected it's the location summary (outdoor weather plus the house tiles) at that location's home route.
 * (The Rules API background that used to live here is now Debug > Info, see DebugInfo.tsx.)
 */
const Home: React.FC = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  useLocationIdParam();
  const locationId = useLocationContextStore(s => s.locationId);

  // once a location is chosen, move from '/' to that location's home route, like the other tabs, so a refresh or
  // bookmark keeps the location
  useEffect(() => {
    if (locationId && pathname === '/') {
      void navigate(`/${global.routing.dashboardSegment}/${locationId}/home`, {replace: true});
    }
  }, [locationId, pathname, navigate]);

  if (!locationId) {
    return (
      <LocationRequiredHint
        sectionName={t('home.sectionName')}
        onChooseLocation={(id, name) => {
          setLocation(id, name);
        }}
      />
    );
  }

  return (
    <>
      <DashboardTitle>
        {t('home.sectionName')}
      </DashboardTitle>
      <PageScroll>
        <HomeWeather />
        <HomeHouse />
      </PageScroll>
    </>
  );
};

export default Home;
