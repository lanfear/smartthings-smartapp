import React from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, GlassPanel} from '../factories/styleFactory';
import {setLocation, useLocationContextStore} from '../store/LocationContextStore';
import LocationRequiredHint from './LocationRequiredHint';

// the location tabs, in nav order - [route segment, title translation key]
const locationTabs: [string, string][] = [
  ['rooms', 'dashboard.room.sectionName'],
  ['scenes', 'dashboard.scene.sectionName'],
  ['rules', 'dashboard.rule.sectionName'],
  ['apps', 'dashboard.installedApp.sectionName'],
  ['climate', 'dashboard.climate.sectionName']
];

const OverviewPanel = styled(GlassPanel)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  max-width: 40rem;
`;

const OverviewTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const OverviewText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
`;

const TabLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

// light-surface pill link - same look as the location buttons in LocationRequiredHint
const TabLink = styled(Link)`
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0b0b0b;
  text-decoration: none;
  background: #ffffff;
  border: 1px solid #c3c2b7;
  border-radius: 999px;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: #f5f5f3;
    border-color: #${global.palette.control.rgb.scene};
  }
`;

/**
 * Landing page. With no location selected it's the choose-a-location hint (choosing one stays here); with one selected
 * it's a placeholder overview linking to that location's tabs - the spot for a future location summary.
 * (The Rules API background that used to live here is now Debug > Info, see DebugInfo.tsx.)
 */
const Home: React.FC = () => {
  const {t} = useTranslation();
  const locationId = useLocationContextStore(s => s.locationId);
  const locationName = useLocationContextStore(s => s.locationName);

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
      <OverviewPanel>
        <OverviewTitle>
          {locationName ?? locationId}
        </OverviewTitle>
        <OverviewText>
          {t('home.placeholder')}
        </OverviewText>
        <TabLinks>
          {locationTabs.map(([segment, titleKey]) => (
            <TabLink
              key={segment}
              to={`/${global.routing.dashboardSegment}/${locationId}/${segment}`}
            >
              {t(titleKey)}
            </TabLink>
          ))}
        </TabLinks>
      </OverviewPanel>
    </>
  );
};

export default Home;
