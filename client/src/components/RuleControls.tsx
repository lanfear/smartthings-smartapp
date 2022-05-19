import React from 'react';
import styled from 'styled-components';
import ActionRuleDisable from './ActionRuleDisable';
import ActionRuleEnable from './ActionRuleEnable';

const ControlsContainer = styled.div`
  height: 75vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: space-between;
  position: sticky;
  top: 0;
`;

const RuleControls: React.FC = () => (
  <ControlsContainer>
    <ActionRuleEnable
      key="control-action-rule-enable"
    />
    <ActionRuleDisable
      key="control-action-rule-disable-2h"
      timeSpan="2h"
    />
    <ActionRuleDisable
      key="control-action-rule-disable-6h"
      timeSpan="6h"
    />
    <ActionRuleDisable
      key="control-action-rule-disable-24h"
      timeSpan="24h"
    />
    <ActionRuleDisable
      key="control-action-rule-disable"
    />
  </ControlsContainer>
);

export default RuleControls;