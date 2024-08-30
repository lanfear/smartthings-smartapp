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

const LocationGroup = styled.div`
  display: flex;
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
    <LocationsGrid className="content">
      {Object.values(locations).map(l => (
        <React.Fragment key={`location-${l.locationId}`}>
          <Link
            key={`location-${l.locationId}-rooms`}
            to={`/dashboard/${l.locationId}/rooms`}
          >
            <LocationGroup className="box">
              <h2>
                {`${l.name} Rooms`}
              </h2>
              <h3>
                {`(${t('location.identifier')}: ${l.locationId})`}
              </h3>
            </LocationGroup>
          </Link>
          <Link
            key={`location-${l.locationId}-scenes`}
            to={`/dashboard/${l.locationId}/scenes`}
          >
            <LocationGroup className="box">
              <h2>
                {`${l.name} Scenes`}
              </h2>
              <h3>
                {`(${t('location.identifier')}: ${l.locationId})`}
              </h3>
            </LocationGroup>
          </Link>
          <Link
            key={`location-${l.locationId}-rules`}
            to={`/dashboard/${l.locationId}/rules`}
          >
            <LocationGroup className="box">
              <h2>
                {`${l.name} Rules`}
              </h2>
              <h3>
                {`(${t('location.identifier')}: ${l.locationId})`}
              </h3>
            </LocationGroup>
          </Link>
          <Link
            key={`location-${l.locationId}-apps`}
            to={`/dashboard/${l.locationId}/apps`}
          >
            <LocationGroup className="box">
              <h2>
                {`${l.name} Apps`}
              </h2>
              <h3>
                {`(${t('location.identifier')}: ${l.locationId})`}
              </h3>
            </LocationGroup>
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
