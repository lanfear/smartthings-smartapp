import React, {ReactNode} from 'react';
import styled from 'styled-components';
import ActionDeviceDim from './ActionDeviceDim';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';

const DeviceControlsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const DeviceControls: React.FC<IDeviceControlsProps> = ({words}) => {
  const deviceControls: ReactNode[] = [];

  // eslint-disable-next-line no-console
  console.log(words);

  deviceControls.push(<ActionDeviceOn words="PowerOn" />);
  deviceControls.push(<ActionDeviceOff words="PowerOff" />);
  
  return (
    <DeviceControlsContainer>
      {deviceControls.map(c => c)}
      <ActionDeviceDim words="Dim" />
      {deviceControls.map(c => c)}
    </DeviceControlsContainer>
  );
};

export interface IDeviceControlsProps {
  words: string;
}

export default DeviceControls;