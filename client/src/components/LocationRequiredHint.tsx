import React from 'react';
import {useTranslation} from 'react-i18next';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import styled from 'styled-components';
import useSWR from 'swr';
import type {RouteParams} from '../App';
import global from '../constants/global';
import {DashboardTitle, GlassPanel} from '../factories/styleFactory';
import getLocations from '../operations/getLocations';

interface ILocationRequiredHintProps {
  sectionName: string; // the page's own title, so the page still says where you are
  // what choosing a location does - defaults to opening this same tab for that location (the /dashboard/:locationId/
  // pages); pages outside /dashboard (e.g. the landing page) pass their own
  onChooseLocation?: (locationId: string, locationName: string) => void;
}

// the nav links are built from the selected location, so with none selected they point at e.g. /dashboard/null/rooms
const isMissingLocationId = (locationId: string | undefined): boolean => !locationId || locationId === 'null' || locationId === 'undefined';

const HintPanel = styled(GlassPanel)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  max-width: 40rem;
`;

const HintTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const HintText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
`;

// the shared DashboardActionButton is styled for the dark glass tiles - this panel is a light surface
const LocationButton = styled.button`
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0b0b0b;
  background: #ffffff;
  border: 1px solid #c3c2b7;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: #f5f5f3;
    border-color: #${global.palette.control.rgb.scene};
  }
`;

const LocationButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

/**
 * Shown by the location dashboard tabs instead of an empty page when they have no location data: with no location
 * selected it explains how to pick one and offers a button per location (opening this same tab for it); with a
 * location in the URL whose data is still loading it just says so, so a normal page load doesn't flash the hint.
 */
const LocationRequiredHint: React.FC<ILocationRequiredHintProps> = ({sectionName, onChooseLocation}) => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const {locationId} = useParams<RouteParams>();
  const needsLocation = isMissingLocationId(locationId);
  const {data: locations = []} = useSWR(needsLocation ? ['locations'] : null, () => getLocations());

  return (
    <>
      <DashboardTitle>
        {sectionName}
      </DashboardTitle>
      {needsLocation
        ? (
          <HintPanel>
            <HintTitle>
              {t('dashboard.locationRequired.title')}
            </HintTitle>
            <HintText>
              {t('dashboard.locationRequired.body')}
            </HintText>
            {locations.length > 0 && (
              <LocationButtons>
                {locations.map(l => (
                  <LocationButton
                    key={l.locationId}
                    onClick={() => {
                      if (onChooseLocation) {
                        onChooseLocation(l.locationId, l.name);
                        return;
                      }
                      // same tab, chosen location - the page picks the location up from the URL
                      void navigate(routeLocation.pathname.replace(new RegExp(`/${global.routing.dashboardSegment}/[^/]+`), `/${global.routing.dashboardSegment}/${l.locationId}`));
                    }}
                  >
                    {l.name}
                  </LocationButton>
                ))}
              </LocationButtons>
            )}
          </HintPanel>
        )
        : (
          <HintText>
            {t('dashboard.locationRequired.loading')}
          </HintText>
        )}
    </>
  );
};

export default LocationRequiredHint;
