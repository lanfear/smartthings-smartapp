import React from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlLogo, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IRuleComponentType} from '../types/sharedContracts';

const getRuleIcon = (ruleType: IRuleComponentType): '🌞' | '🌚' | '🔀' | '💤' => ruleType === 'daylight' ? '🌞' : ruleType === 'nightlight' ? '🌚' : ruleType === 'transition' ? '🔀' : '💤';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Rule: React.FC<IRuleProps> = ({rulePartId, ruleName, ruleType, time, isRuleActive, isRuleEnabled, isKeyRule, setActiveDevice}) => {
  const dragId = `${ruleType.toLowerCase()}-${rulePartId}`;
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.Rule, rulePartId, ruleName, ruleType)));
  const iconography = `${isKeyRule ? '🔑' : ''}${isRuleEnabled ? '' : '🚫'}`;

  return (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={isRuleActive ? `${global.palette.control.rgb.rule}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: ruleName, id: `${IDragAndDropType.Rule}-${dragId}`})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: ruleName, id: `${IDragAndDropType.Rule}-${dragId}`})}
      onTouchEnd={() => setActiveDevice(null)}
    >
      <ControlLogo>
        {getRuleIcon(ruleType)}
      </ControlLogo>
      <ControlStatus>
        {time}
      </ControlStatus>
      {iconography ?? (
        <ControlIcon>
          {iconography}
        </ControlIcon>
      )}
    </ControlContainer>
  );
};

export interface IRuleProps {
  rulePartId: string;
  ruleName: string;
  ruleType: IRuleComponentType;
  time: string;
  isRuleActive: boolean;
  isRuleEnabled: boolean;
  isKeyRule: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default Rule;
