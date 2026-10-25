import React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components';

export interface INavHoverMenuItem {
  key: string;
  label: string;
  to: string;
}

interface INavHoverMenuProps {
  label: string;
  to: string; // the top-level link itself still navigates - the menu just adds shortcuts into the page
  isSelected: boolean;
  items: INavHoverMenuItem[];
}

const MenuContainer = styled.div`
  position: relative;
  display: flex;

  /* open on hover, and on keyboard focus anywhere inside so the items are reachable by tabbing. focus-visible (not
     focus-within) so a mouse click - which leaves the clicked link focused - doesn't keep the menu stuck open */
  &:hover > div,
  &:has(:focus-visible) > div {
    display: block;
  }
`;

// padding (not margin) above the list, so moving the mouse from the link down to the items never leaves the hover area
const MenuDropdown = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  padding-top: 4px;
`;

const MenuList = styled.div`
  min-width: 200px;
  background-color: white;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: hidden;
`;

const MenuItem = styled(Link)`
  display: block;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:focus {
    background-color: #f5f5f5;
  }
`;

/**
 * A nav link that also shows a menu of sub-links on hover/focus (e.g. jumping to a section of the page). Unlike
 * DropdownButton (click to open, for choosing an option), the label is itself a link - clicking it goes to the page.
 */
const NavHoverMenu: React.FC<INavHoverMenuProps> = ({label, to, isSelected, items}) => (
  <MenuContainer>
    <Link
      className={`navbar-item flex-column-center ${isSelected ? 'selected' : ''}`}
      to={to}
    >
      {`${label} ▾`}
    </Link>
    <MenuDropdown>
      <MenuList>
        {items.map(item => (
          <MenuItem
            key={item.key}
            to={item.to}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </MenuDropdown>
  </MenuContainer>
);

export default NavHoverMenu;
