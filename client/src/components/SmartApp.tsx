import React from 'react';
import {ControlContainer, ControlIcon} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IApp} from '../types/sharedContracts';

const SmartApp: React.FC<ISmartAppProps> = ({app, isRuleEnabled, setActiveDevice}) => (
  <ControlContainer
    rgb={isRuleEnabled ? 'E68C24' : 'cccccc'}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: app.displayName!, id: app.appId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: app.displayName!, id: app.appId})}
    onTouchEnd={() => setActiveDevice(null)}
  >
    <ControlIcon>
        🤖
    </ControlIcon>
  </ControlContainer>
);

export interface ISmartAppProps {
  app: IApp;
  isRuleEnabled: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default SmartApp;