import React from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlLogo, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IApp} from '../types/sharedContracts';

const SmartApp: React.FC<ISmartAppProps> = ({app, isRuleEnabled, setActiveDevice}) => {
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.App, app.installedAppId, app.displayName!)));

  return (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={isRuleEnabled ? `${global.palette.control.rgb.app}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: app.displayName!, id: app.appId})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: app.displayName!, id: app.appId})}
      onTouchEnd={() => setActiveDevice(null)}
    >
      <ControlLogo>
          🤖
      </ControlLogo>
      <ControlStatus>
        RuleSet
      </ControlStatus>
    </ControlContainer>
  );
};

export interface ISmartAppProps {
  app: IApp;
  isRuleEnabled: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default SmartApp;
