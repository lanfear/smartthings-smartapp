import React from 'react';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';

type RuleComponentType = 'Daylight' | 'Nightlight' | 'Transition' | 'Idle';

const getRuleIcon = (ruleType: RuleComponentType): '🌞' | '🌚' | '🔀' | '💤' => ruleType === 'Daylight' ? '🌞' : ruleType === 'Nightlight' ? '🌚' : ruleType === 'Transition' ? '🔀' : '💤';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const App: React.FC<IRuleProps> = ({rulePartId, ruleName, ruleType, time, isRuleEnabled, setActiveDevice}) => (
  <ControlContainer
    rgb={isRuleEnabled ? 'E68C24' : 'cccccc'}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: ruleName, id: rulePartId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: ruleName, id: rulePartId})}
    onTouchEnd={() => setActiveDevice(null)}
  >
    <ControlIcon>
      {getRuleIcon(ruleType)}
    </ControlIcon>
    <ControlStatus>
      {time}
    </ControlStatus>
  </ControlContainer>
);

export interface IRuleProps {
  rulePartId: string;
  ruleName: string;
  ruleType: RuleComponentType;
  time: string;
  isRuleEnabled: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default App;