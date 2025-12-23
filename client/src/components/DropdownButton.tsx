import React, {useEffect, useState, useRef, memo} from 'react';
import styled from 'styled-components';
import {useLocationContextStore} from '../store/LocationContextStore';
import {StyledButton} from '../factories/styleFactory';

const DropdownContainer = styled.div`
  display: flex;
  position: relative;
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

interface IPublicProps {
  children: React.ReactNode;
}

export const DropdownButton: React.FC<IPublicProps> = ({children}) => {
  const locationName = useLocationContextStore(s => s.locationName);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <DropdownContainer ref={dropdownRef}>
      <StyledButton
        className="navbar-item flex-column-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {`${locationName ?? 'Locations'} ▾`}
      </StyledButton>
      <DropdownMenu $isOpen={isOpen}>
        {children}
      </DropdownMenu>
    </DropdownContainer>
  );
};

export default memo(DropdownButton);

interface IDropdownOptionPublicProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isChecked: boolean;
  children: React.ReactNode;
}

const BaseDropdownOption: React.FC<IDropdownOptionPublicProps> = ({onClick, isChecked, children}) => (
  <DropdownItem
    onClick={onClick}
  >
    {isChecked && (
      <Checkmark>
        ✓
      </Checkmark>
    )}
    {children}
  </DropdownItem>
);

export const DropdownOption = memo(BaseDropdownOption);
