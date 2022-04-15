import React from 'react';
import styled from 'styled-components';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';

type RuleComponentType = 'Daylight' | 'Nightlight' | 'Transition' | 'Idle';

const RuleContainer = styled(ControlContainer) <{ isRuleEnabled: boolean }>`
  ${props => props.isRuleEnabled ? `
  box-shadow:
      0px 0px 10px 2px orange, 
      inset 0px 0px 20px 15px orange;
  ` : ''}
`;

const getRuleIcon = (ruleType: RuleComponentType): '🌞' | '🌚' | '🔀' | '💤' => ruleType === 'Daylight' ? '🌞' : ruleType === 'Nightlight' ? '🌚' : ruleType === 'Transition' ? '🔀' : '💤';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const App: React.FC<IRuleProps> = ({rulePartId, ruleName, ruleType, time, isRuleEnabled, setActiveDevice}) => (
  <RuleContainer
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: ruleName, id: rulePartId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: ruleName, id: rulePartId})}
    onTouchEnd={() => setActiveDevice(null)}
    isRuleEnabled={isRuleEnabled}
  >
    <ControlIcon>
      {getRuleIcon(ruleType)}
    </ControlIcon>
    <ControlStatus>
      {time}
    </ControlStatus>
  </RuleContainer>
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