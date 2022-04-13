import React from 'react';
import styled from 'styled-components';
import {ControlContainer, ControlIcon} from '../factories/styleFactory';
import {IApp} from '../types/sharedContracts';

// ideas: 🪄 🔮 🕹 🔌 💾 🔐 🔑 🔂

const SmartAppContainer = styled(ControlContainer) <{isRuleEnabled: boolean}>`
  ${props => props.isRuleEnabled ? `
  box-shadow:
      0px 0px 10px 2px orange, 
      inset 0px 0px 20px 15px orange;
  ` : ''}
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SmartApp: React.FC<ISmartAppProps> = ({app, isRuleEnabled}) => (
  <SmartAppContainer
    // onMouseEnter={() => setPopoverOpen(true)}
    // onMouseLeave={() => setPopoverOpen(false)}
    // onTouchStart={() => setPopoverOpen(true)}
    // onTouchEnd={() => setPopoverOpen(false)}
    isRuleEnabled={isRuleEnabled}
  >
    <ControlIcon>
        🤖
    </ControlIcon>
  </SmartAppContainer>
);

export interface ISmartAppProps {
  app: IApp;
  isRuleEnabled: boolean;
}

export default SmartApp;