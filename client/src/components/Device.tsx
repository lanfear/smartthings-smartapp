import React from 'react';
import styled from 'styled-components';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IDevice} from '../types/sharedContracts';


const LightContainer = styled(ControlContainer) <{ isLightOn: boolean; isLocked: boolean }>`
  ${props => props.isLightOn ? `
  box-shadow:
      0px 0px 10px 2px ${props.isLocked ? 'red' : 'yellow'}, 
      inset 0px 0px 20px 15px ${props.isLocked ? 'red' : 'yellow'};
  ` : ''}
`;

const MotionContainer = styled(ControlContainer) <{ isActive: boolean }>`
  ${props => props.isActive ? `
  box-shadow:
      0px 0px 10px 2px lightgreen, 
      inset 0px 0px 20px 15px lightgreen;
  ` : ''}
`;

const Device: React.FC<IDeviceProps> = ({device, deviceType, setActiveDevice, isLocked}) => deviceType === 'Switch' ? (
  <LightContainer
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
    onTouchEnd={() => setActiveDevice(null)}
    isLightOn={device.value === 'on'}
    isLocked={!!isLocked}
  >
    {/* <span>{t('dashboard.switch.header.deviceId')}: {device.deviceId}</span> */}
    <ControlIcon>
      {isLocked ? '🔒💡' : '💡'}
    </ControlIcon>
    <ControlStatus>
      {device.value}
    </ControlStatus>
  </LightContainer>
) : deviceType === 'Lock' ? (
  <ControlContainer
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onMouseEnter={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
    onMouseLeave={() => setActiveDevice(null)}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onTouchStart={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
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
  setActiveDevice: (value: IActiveControl | null) => void;
  isLocked?: boolean;
}

export default Device;