import {useState, useEffect, memo} from 'react';
import {Link} from 'react-router-dom';
import global from '../constants/global';
import DropdownButton, {DropdownOption} from './DropdownButton';
import {setLocation, useLocationContextStore} from '../store/LocationContextStore';
import getLocations, {IResponseLocations} from '../operations/getLocations';

const NavMenu: React.FC = () => {
  const locationId = useLocationContextStore(s => s.locationId);
  const locationName = useLocationContextStore(s => s.locationName);
  const [locations, setLocations] = useState<IResponseLocations>([]);

  useEffect(() => {
    const getLocationsAsync = async (): Promise<void> => {
      const fetchedLocations = await getLocations();
      setLocations(fetchedLocations);
    };

    void getLocationsAsync();
  }, []);

  const locationOptions = locations.map(location => (
    <DropdownOption
      key={location.locationId}
      onClick={() => {
        setLocation(location.locationId, location.name);
      }}
      isChecked={location.locationId === locationId}
    >
      {location.name}
    </DropdownOption>
  ));

  const debugOptions = (
    <>
      <DropdownOption
        key="nav-rule-examples"
        isChecked={false}
      >
        <Link
          className="navbar-item flex-column-center"
          to="/rule-examples"
        >
          Rule Examples
        </Link>
      </DropdownOption>
      <DropdownOption
        key="nav-basic-templates"
        isChecked={false}
      >

        <Link
          className="navbar-item flex-column-center"
          to="/basic-templates"
        >
          Basic Templates
        </Link>
      </DropdownOption>
      <DropdownOption
        key="nav-advanced-templates"
        isChecked={false}
      >
        <Link
          className="navbar-item flex-column-center"
          to="/advanced-templates"
        >
          Advanced Templates
        </Link>
      </DropdownOption>
      <DropdownOption
        key="nav-smartapps-debug"
        isChecked={false}
      >
        <Link
          className="navbar-item flex-column-center"
          to="/smartapps"
        >
          Debugging (SmartApps)
        </Link>
      </DropdownOption>
    </>
  );

  return (
    <nav
      className="navbar"
      style={{zIndex: global.zIndex.header}}
    >
      <DropdownButton buttonText={locationName ?? 'Locations'}>
        {locationOptions}
      </DropdownButton>
      <Link
        key="location-rooms"
        className="navbar-item flex-column-center"
        to={`/dashboard/${locationId}/rooms`}
      >
      Rooms
      </Link>
      <Link
        key="location-scenes"
        className="navbar-item flex-column-center"
        to={`/dashboard/${locationId}/scenes`}
      >
      Scenes
      </Link>
      <Link
        key="location-rules"
        className="navbar-item flex-column-center"
        to={`/dashboard/${locationId}/rules`}
      >
      Rules
      </Link>
      <Link
        key="location-apps"
        className="navbar-item flex-column-center"
        to={`/dashboard/${locationId}/apps`}
      >
      Apps
      </Link>
      <DropdownButton buttonText="Debug">
        {debugOptions}
      </DropdownButton>
    </nav>
  );
};

export default memo(NavMenu);
