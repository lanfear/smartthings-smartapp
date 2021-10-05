import React from 'react';
import styled from 'styled-components';
import {IDevice} from '../types/smartthingsExtensions';

const DeviceTitle = styled.div`
    font-size: larger;
    font-weight: 700;
`;

const DeviceStatus = styled.div`
    font-size: smaller;
    font-weight: 500;
`;

const DeviceContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: space-evenly;
    border: 1px solid gray;
    border-radius: 4px;
`;

const LightContainer = styled(DeviceContainer)<{isLightOn: boolean}>`
    ${props => props.isLightOn ? `
    box-shadow:
        0px 0px 10px 2px yellow, 
        inset 0px 0px 20px 15px yellow;
    ` : ''}
`;

const MotionContainer = styled(DeviceContainer)<{isActive: boolean}>`
    ${props => props.isActive ? `
    box-shadow:
        0px 0px 10px 2px lightgreen, 
        inset 0px 0px 20px 15px lightgreen;
    ` : ''}
`;

const Device: React.FC<IDeviceProps> = ({device, deviceType}) => (
  deviceType === 'Switch' ? (
    <LightContainer isLightOn={device.value === 'on'}>
      <DeviceTitle>
        {device.label}
      </DeviceTitle>
      {/* <span>{t('dashboard.switch.header.deviceId')}: {device.deviceId}</span> */}
      <DeviceStatus>
        {device.value}
      </DeviceStatus>
    </LightContainer>
  ) : deviceType === 'Lock' ? (
    <DeviceContainer>
      <DeviceTitle>
        {device.label}
      </DeviceTitle>
      {/* <span>{t('dashboard.lock.header.deviceId')}: {device.deviceId}</span> */}
      <DeviceStatus>
        {device.value}
      </DeviceStatus>
    </DeviceContainer>
  ) : (
    <MotionContainer isActive={device.value === 'active'}>
      <DeviceTitle>
        {device.label}
      </DeviceTitle>
      {/* <span>{t('dashboard.motion.header.deviceId')}: {device.deviceId}</span> */}
      <DeviceStatus>
        {device.value}
      </DeviceStatus>
    </MotionContainer>
  )
);

export type DeviceType = 'Switch' | 'Lock' | 'Motion';

export interface IDeviceProps {
  device: IDevice;
  deviceType: DeviceType;
}

export default Device;