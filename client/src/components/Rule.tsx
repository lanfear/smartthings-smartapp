import React from 'react';
import styled from 'styled-components';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';

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
const App: React.FC<IRuleProps> = ({ruleType, time, isRuleEnabled}) => (
  <RuleContainer
    // onMouseEnter={() => setPopoverOpen(true)}
    // onMouseLeave={() => setPopoverOpen(false)}
    // onTouchStart={() => setPopoverOpen(true)}
    // onTouchEnd={() => setPopoverOpen(false)}
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
  ruleType: RuleComponentType;
  time: string;
  isRuleEnabled: boolean;
}

export default App;