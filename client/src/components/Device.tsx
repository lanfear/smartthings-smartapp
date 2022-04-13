import React from 'react';
import styled from 'styled-components';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IDevice} from '../types/sharedContracts';


const LightContainer = styled(ControlContainer) <{ isLightOn: boolean }>`
  ${props => props.isLightOn ? `
  box-shadow:
      0px 0px 10px 2px yellow, 
      inset 0px 0px 20px 15px yellow;
  ` : ''}
`;

const MotionContainer = styled(ControlContainer) <{ isActive: boolean }>`
  ${props => props.isActive ? `
  box-shadow:
      0px 0px 10px 2px lightgreen, 
      inset 0px 0px 20px 15px lightgreen;
  ` : ''}
`;

const Device: React.FC<IDeviceProps> = ({device, deviceType, setActiveDevice}) => deviceType === 'Switch' ? (
  <LightContainer
    onMouseEnter={() => setActiveDevice(device)}
    onMouseLeave={() => setActiveDevice(null)}
    onTouchStart={() => setActiveDevice(device)}
    onTouchEnd={() => setActiveDevice(null)}
    isLightOn={device.value === 'on'}
  >
    {/* <span>{t('dashboard.switch.header.deviceId')}: {device.deviceId}</span> */}
    <ControlIcon>
      💡
    </ControlIcon>
    <ControlStatus>
      {device.value}
    </ControlStatus>
  </LightContainer>
) : deviceType === 'Lock' ? (
  <ControlContainer
    onMouseEnter={() => setActiveDevice(device)}
    onMouseLeave={() => setActiveDevice(null)}
    onTouchStart={() => setActiveDevice(device)}
    onTouchEnd={() => setActiveDevice(null)}
  >
    {/* <span>{t('dashboard.lock.header.deviceId')}: {device.deviceId}</span> */}
    <ControlIcon>
      {device.value === 'locked' ? '🔒' : '🔓'}
    </ControlIcon>
    <ControlStatus>
      {device.value}
    </ControlStatus>
  </ControlContainer>
) : (
  <MotionContainer
    onMouseEnter={() => setActiveDevice(device)}
    onMouseLeave={() => setActiveDevice(null)}
    onTouchStart={() => setActiveDevice(device)}
    onTouchEnd={() => setActiveDevice(null)}
    isActive={device.value === 'active'}
  >
    {/* <span>{t('dashboard.motion.header.deviceId')}: {device.deviceId}</span> */}
    <ControlIcon>
      {device.value === 'active' ? '🏃' : '🧍'}
    </ControlIcon>
    <ControlStatus>
      {device.value}
    </ControlStatus>
  </MotionContainer>
);

export type DeviceType = 'Switch' | 'Lock' | 'Motion';

export interface IDeviceProps {
  device: IDevice;
  deviceType: DeviceType;
  setActiveDevice: (value: IDevice|null) => void;
}

export default Device;