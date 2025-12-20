import React, {useEffect, useState, useRef} from 'react';
import styled from 'styled-components';
import getLocations, {IResponseLocations} from '../operations/getLocations';
import {setLocation, useLocationContextStore} from '../store/LocationContextStore';

const DropdownContainer = styled.div`
  display: flex;
  position: relative;
`;

const DropdownButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
`;

const DropdownMenu = styled.div<{$isOpen: boolean}>`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  border-radius: 4px;
  margin-top: 4px;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: #333;

  &:hover {
    background-color: #f5f5f5;
  }

  &:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  &:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

const Checkmark = styled.span`
  margin-right: 8px;
  min-width: 16px;
  display: inline-block;
`;

const LocationDropdown: React.FC = () => {
  const locationId = useLocationContextStore(s => s.locationId);
  const [locations, setLocations] = useState<IResponseLocations>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getLocationsAsync = async (): Promise<void> => {
      const fetchedLocations = await getLocations();
      setLocations(fetchedLocations);
    };

    void getLocationsAsync();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocationSelect = (selectedLocationId: string, selectedLocationName: string): void => {
    setLocation(selectedLocationId, selectedLocationName);
    setIsOpen(false);
  };

  const selectedLocation = locations.find(l => l.locationId === locationId);

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        className="navbar-item flex-column-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLocation?.name ?? 'Locations'}
        {' ▾'}
      </DropdownButton>
      <DropdownMenu $isOpen={isOpen}>
        {locations.map(location => (
          <DropdownItem
            key={location.locationId}
            onClick={() => handleLocationSelect(location.locationId, location.name)}
          >
            <Checkmark>
              {location.locationId === locationId ? '✓' : ''}
            </Checkmark>
            {location.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </DropdownContainer>
  );
};

export default LocationDropdown;
