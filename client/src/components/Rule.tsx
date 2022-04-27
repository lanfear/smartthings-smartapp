import React from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IRuleComponentType} from '../types/sharedContracts';

const getRuleIcon = (ruleType: IRuleComponentType): '🌞' | '🌚' | '🔀' | '💤' => ruleType === 'daylight' ? '🌞' : ruleType === 'nightlight' ? '🌚' : ruleType === 'transition' ? '🔀' : '💤';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Rule: React.FC<IRuleProps> = ({rulePartId, ruleName, ruleType, time, isRuleEnabled, isKeyRule, setActiveDevice}) => {
  const dragId = `${ruleType.toLowerCase()}-${rulePartId}`;
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.Rule, dragId, ruleName)));
  const iconography = `${getRuleIcon(ruleType)}${isKeyRule ? '🔑' : ''}`;

  return (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={isRuleEnabled ? `${global.palette.control.rgb.rule}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: ruleName, id: `${IDragAndDropType.Rule}-${dragId}`})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: ruleName, id: `${IDragAndDropType.Rule}-${dragId}`})}
      onTouchEnd={() => setActiveDevice(null)}
    >
      <ControlIcon>
        {iconography}
      </ControlIcon>
      <ControlStatus>
        {time}
      </ControlStatus>
    </ControlContainer>
  );
};

export interface IRuleProps {
  rulePartId: string;
  ruleName: string;
  ruleType: IRuleComponentType;
  time: string;
  isRuleEnabled: boolean;
  isKeyRule: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default Rule;