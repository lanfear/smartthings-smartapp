import React from 'react';
import styled from 'styled-components';
import {ControlContainer, ControlIcon} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IApp} from '../types/sharedContracts';

// ideas: 🪄 🔮 🕹 🔌 💾 🔐 🔑 🔂

const SmartAppContainer = styled(ControlContainer) <{isRuleEnabled: boolean}>`
  ${props => props.isRuleEnabled ? `
  box-shadow:
      0px 0px 10px 2px orange, 
      inset 0px 0px 20px 15px orange;
  ` : ''}
`;

const SmartApp: React.FC<ISmartAppProps> = ({app, isRuleEnabled, setActiveDevice}) => (
  <SmartAppContainer
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: app.displayName!, id: app.appId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: app.displayName!, id: app.appId})}
    onTouchEnd={() => setActiveDevice(null)}
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
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default SmartApp;