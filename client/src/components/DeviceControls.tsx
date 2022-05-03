import React, {ReactNode} from 'react';
import styled from 'styled-components';
import ActionDeviceDim from './ActionDeviceDim';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';
import ActionRuleDisable from './ActionRuleDisable';
import ActionRuleEnable from './ActionRuleEnable';

const DeviceControlsContainer = styled.div`
  height: 75vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: space-between;
  position: sticky;
  top: 0;
`;

const DeviceControls: React.FC<IDeviceControlsProps> = ({words}) => {
  const deviceControls: ReactNode[] = [];

  // eslint-disable-next-line no-console
  console.log(words);

  deviceControls.push(<ActionDeviceOn words="PowerOn" />);
  deviceControls.push(<ActionDeviceOff words="PowerOff" />);
  deviceControls.push(<ActionDeviceDim words="Dim" />);
  deviceControls.push(<ActionRuleEnable words="(E)" />);
  deviceControls.push(<ActionRuleDisable words="(D)" />);
  
  return (
    <DeviceControlsContainer>
      {deviceControls.map(c => c)}
    </DeviceControlsContainer>
  );
};

export interface IDeviceControlsProps {
  words: string;
}

export default DeviceControls;