import React, {useEffect, useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import getLocations, {IResponseLocations} from '../operations/getLocations';

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
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

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
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
  const [locations, setLocations] = useState<IResponseLocations>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    localStorage.getItem('selectedLocationId')
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getLocationsAsync = async (): Promise<void> => {
      const fetchedLocations = await getLocations();
      setLocations(fetchedLocations);

      // If no location is selected and we have locations, select the first one
      if (!selectedLocationId && fetchedLocations.length > 0) {
        const firstLocationId = fetchedLocations[0].locationId;
        setSelectedLocationId(firstLocationId);
        localStorage.setItem('selectedLocationId', firstLocationId);
      }
    };

    void getLocationsAsync();
  }, [selectedLocationId]);

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

  const handleLocationSelect = (locationId: string): void => {
    setSelectedLocationId(locationId);
    localStorage.setItem('selectedLocationId', locationId);
    setIsOpen(false);
    navigate(`/dashboard/${locationId}/rooms`);
  };

  const selectedLocation = locations.find(l => l.locationId === selectedLocationId);

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        className="navbar-item"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLocation?.name ?? 'Locations'}
        {' ▾'}
      </DropdownButton>
      <DropdownMenu $isOpen={isOpen}>
        {locations.map(location => (
          <DropdownItem
            key={location.locationId}
            onClick={() => handleLocationSelect(location.locationId)}
          >
            <Checkmark>
              {location.locationId === selectedLocationId ? '✓' : ''}
            </Checkmark>
            {location.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </DropdownContainer>
  );
};

export default LocationDropdown;
