import React, {ReactNode} from 'react';
import styled from 'styled-components';
import DeviceOffAction from './DeviceOffAction';
import DeviceOnAction from './DeviceOnAction';

const DeviceControlsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const DeviceControls: React.FC<IDeviceControlsProps> = ({words}) => {
  const deviceControls: ReactNode[] = [];

  deviceControls.push(<DeviceOnAction words="PowerOn" />);
  deviceControls.push(<DeviceOffAction words="PowerOff" />);
  
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