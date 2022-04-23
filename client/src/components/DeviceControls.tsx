import React, {ReactNode} from 'react';
import styled from 'styled-components';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';

const DeviceControlsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const DeviceControls: React.FC<IDeviceControlsProps> = ({words}) => {
  const deviceControls: ReactNode[] = [];

  deviceControls.push(<ActionDeviceOn words="PowerOn" />);
  deviceControls.push(<ActionDeviceOff words="PowerOff" />);
  
  return (
    <DeviceControlsContainer>
      {deviceControls.map(c => c)}
      {words}
      {deviceControls.map(c => c)}
    </DeviceControlsContainer>
  );
};

export interface IDeviceControlsProps {
  words: string;
}

export default DeviceControls;