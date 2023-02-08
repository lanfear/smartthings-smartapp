import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import getLocations, {IResponseLocations} from '../operations/getLocations';

const LocationsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

const Locations: React.FC<LocationsProps> = () => {
  const {t} = useTranslation();

  const [locations, setLocations] = useState<IResponseLocations>([]);

  useEffect(() => {
    const getLocationsAsync = async (): Promise<void> => {
      setLocations(await getLocations());
    };

    void getLocationsAsync();
  }, []);

  return (
    <LocationsGrid>
      {Object.values(locations).map(l => (
        <React.Fragment key={`location-${l.locationId}`}>
          <Link
            key={`location-${l.locationId}-rooms`}
            to={`/dashboard/${l.locationId}/rooms`}
          >
            <div>
              {`${t('location.identifier')}: ${l.locationId}`}
            </div>
            <div>
              {`${t('location.name')}: ${l.name} Rooms`}
            </div>
          </Link>
          <Link
            key={`location-${l.locationId}-scenes`}
            to={`/dashboard/${l.locationId}/scenes`}
          >
            <div>
              {`${t('location.identifier')}: ${l.locationId} Scenes`}
            </div>
            <div>
              {`${t('location.name')}: ${l.name}`}
            </div>
          </Link>
          <Link
            key={`location-${l.locationId}-rules`}
            to={`/dashboard/${l.locationId}/rules`}
          >
            <div>
              {`${t('location.identifier')}: ${l.locationId} Rules`}
            </div>
            <div>
              {`${t('location.name')}: ${l.name}`}
            </div>
          </Link>
          <Link
            key={`location-${l.locationId}-apps`}
            to={`/dashboard/${l.locationId}/apps`}
          >
            <div>
              {`${t('location.identifier')}: ${l.locationId} Apps`}
            </div>
            <div>
              {`${t('location.name')}: ${l.name}`}
            </div>
          </Link>
        </React.Fragment>
      ))}
    </LocationsGrid>
  );
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LocationsProps {
}

export default Locations;
