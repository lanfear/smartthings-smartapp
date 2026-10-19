import React from 'react';
import styled from 'styled-components';
import ActionDeviceDim from './ActionDeviceDim';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';
import ActionRuleDisable from './ActionRuleDisable';
import ActionRuleEnable from './ActionRuleEnable';
import ActionSceneExecute from './ActionSceneExecute';

// buttons stack in one column with the dimmer as a full-height column beside them
const ControlsContainer = styled.div`
  height: 75vh;
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const ButtonColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const DimmerColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const DeviceControls: React.FC = () => (
  <ControlsContainer>
    <ButtonColumn>
      <ActionDeviceOn
        key="control-action-power-on"
        words="On"
      />
      <ActionSceneExecute
        key="control-action-scene-execute"
        words="Play Scene"
      />
      <ActionRuleEnable
        key="control-action-rule-enable"
        words="Enable"
      />
      <ActionRuleDisable
        key="control-action-rule-disable-2h"
        words="Disable 2hrs"
        reEnableAfter={2}
      />
      <ActionRuleDisable
        key="control-action-rule-disable-8h"
        words="Disable 8hrs"
        reEnableAfter={8}
      />
      <ActionRuleDisable
        key="control-action-rule-disable"
        words="Disable"
      />
      <ActionDeviceOff
        key="control-action-power-off"
        words="Off"
      />
    </ButtonColumn>
    <DimmerColumn>
      <ActionDeviceDim
        key="control-action-power-dim"
      />
    </DimmerColumn>
  </ControlsContainer>
);

export default DeviceControls;
