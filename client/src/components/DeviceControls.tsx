import React from 'react';
import styled from 'styled-components';
import ActionDeviceDim from './ActionDeviceDim';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';
import ActionRuleDisable from './ActionRuleDisable';
import ActionRuleEnable from './ActionRuleEnable';

const ControlsContainer = styled.div`
  height: 75vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: space-between;
`;

const DeviceControls: React.FC = () => (
  <ControlsContainer>
    <ActionDeviceOn
      key="control-action-power-on"
      words="On"
    />
    <ActionRuleEnable
      key="control-action-rule-enable"
      words="Enable"
    />
    <ActionDeviceDim
      key="control-action-power-dim"
    />
    <ActionRuleDisable
      key="control-action-rule-disable"
      words="Disable"
    />
    <ActionDeviceOff
      key="control-action-power-off"
      words="Off"
    />
  </ControlsContainer>
);

export default DeviceControls;
