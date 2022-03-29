import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import getLocations, {IResponseLocations} from '../operations/getLocations';

const LocationsGrid = styled.div`
    display: grid;
    grid-template-columns: 3fr repeat(3, 1fr);
    gap: 10px;
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
        <Link
          key={`location-${l.locationId}`}
          to={`/dashboard/${l.locationId}`}
        >
          <div>
            {`${t('location.identifier')}: ${l.locationId}`}
          </div>
          <div>
            {`${t('location.name')}: ${l.name}`}
          </div>
        </Link>
      ))}
    </LocationsGrid>
  );
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LocationsProps {
}

export default Locations;