import React from 'react';
import global from '../constants/global';
import {ControlContainer, ControlIcon} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IApp} from '../types/sharedContracts';

const SmartApp: React.FC<ISmartAppProps> = ({app, isRuleEnabled, setActiveDevice}) => (
  <ControlContainer
    rgb={isRuleEnabled ? `${global.palette.control.rgb.app}` : `${global.palette.control.rgb.inactive}`}
    onMouseEnter={() => setActiveDevice({name: app.displayName!, id: app.appId})}
    onMouseLeave={() => setActiveDevice(null)}
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