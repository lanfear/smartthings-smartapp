import React from 'react';
import styled from 'styled-components';
import ActionDeviceDim from './ActionDeviceDim';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';

const ControlsContainer = styled.div`
  height: 75vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: space-between;
  position: sticky;
  top: 0;
`;

const DeviceControls: React.FC = () => (
  <ControlsContainer>
    <ActionDeviceOn
      key="control-action-power-on"
    />
    <ActionDeviceDim
      key="control-action-power-dim"
    />
    <ActionDeviceOff
      key="control-action-power-off"
    />
  </ControlsContainer>
);

export default DeviceControls;