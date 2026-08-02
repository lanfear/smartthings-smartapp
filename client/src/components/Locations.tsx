import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardDataGrid} from '../factories/styleFactory';
import getLocations, {type IResponseLocations} from '../operations/getLocations';

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
    <DashboardDataGrid
      className="content"
      columns="1fr"
      rowMinHeight="100px"
    >
      {Object.values(locations).map(l => (
        <React.Fragment key={`location-${l.locationId}`}>
          <Link
            key={`location-${l.locationId}-rooms`}
            to={`/${global.routing.dashboardSegment}/${l.locationId}/rooms`}
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
            to={`/${global.routing.dashboardSegment}/${l.locationId}/scenes`}
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
            to={`/${global.routing.dashboardSegment}/${l.locationId}/rules`}
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
            to={`/${global.routing.dashboardSegment}/${l.locationId}/apps`}
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
    </DashboardDataGrid>
  );
};

export interface LocationsProps {
}

export default Locations;
