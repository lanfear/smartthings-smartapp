import React from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';

type RuleComponentType = 'Daylight' | 'Nightlight' | 'Transition' | 'Idle';

const getRuleIcon = (ruleType: RuleComponentType): '🌞' | '🌚' | '🔀' | '💤' => ruleType === 'Daylight' ? '🌞' : ruleType === 'Nightlight' ? '🌚' : ruleType === 'Transition' ? '🔀' : '💤';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Rule: React.FC<IRuleProps> = ({rulePartId, ruleName, ruleType, time, isRuleEnabled, isKeyRule, setActiveDevice}) => {
  const dragId = `${ruleType.toLowerCase()}-${rulePartId}`;
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.Rule, dragId, ruleName)));

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
        {getRuleIcon(ruleType)}
        {isKeyRule && '🔑'}
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
  ruleType: RuleComponentType;
  time: string;
  isRuleEnabled: boolean;
  isKeyRule: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default Rule;