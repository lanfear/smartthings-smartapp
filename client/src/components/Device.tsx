import React from 'react';
import styled from 'styled-components';
import {IDevice} from '../types/smartthingsExtensions';

const DeviceStatus = styled.div`
  font-size: smaller;
  font-weight: 500;
`;

const DeviceIcon = styled.div`
  font-size: larger;
`;

const DeviceContainer = styled.button`
  height: 3rem;
  width: 3rem;
  display: flex;
  flex: none;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: space-evenly;
  border: 1px solid gray;
  border-radius: 4px;
`;

const LightContainer = styled(DeviceContainer) <{ isLightOn: boolean }>`
  ${props => props.isLightOn ? `
  box-shadow:
      0px 0px 10px 2px yellow, 
      inset 0px 0px 20px 15px yellow;
  ` : ''}
`;

const MotionContainer = styled(DeviceContainer) <{ isActive: boolean }>`
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
    <DeviceIcon>
      💡
    </DeviceIcon>
    <DeviceStatus>
      {device.value}
    </DeviceStatus>
  </LightContainer>
) : deviceType === 'Lock' ? (
  <DeviceContainer
    onMouseEnter={() => setActiveDevice(device)}
    onMouseLeave={() => setActiveDevice(null)}
    onTouchStart={() => setActiveDevice(device)}
    onTouchEnd={() => setActiveDevice(null)}
  >
    {/* <span>{t('dashboard.lock.header.deviceId')}: {device.deviceId}</span> */}
    <DeviceIcon>
      {device.value === 'locked' ? '🔒' : '🔓'}
    </DeviceIcon>
    <DeviceStatus>
      {device.value}
    </DeviceStatus>
  </DeviceContainer>
) : (
  <MotionContainer
    onMouseEnter={() => setActiveDevice(device)}
    onMouseLeave={() => setActiveDevice(null)}
    onTouchStart={() => setActiveDevice(device)}
    onTouchEnd={() => setActiveDevice(null)}
    isActive={device.value === 'active'}
  >
    {/* <span>{t('dashboard.motion.header.deviceId')}: {device.deviceId}</span> */}
    <DeviceIcon>
      {device.value === 'active' ? '🏃' : '🧍'}
    </DeviceIcon>
    <DeviceStatus>
      {device.value}
    </DeviceStatus>
  </MotionContainer>
);

export type DeviceType = 'Switch' | 'Lock' | 'Motion';

export interface IDeviceProps {
  device: IDevice;
  deviceType: DeviceType;
  setActiveDevice: (value: IDevice|null) => void;
}

export default Device;