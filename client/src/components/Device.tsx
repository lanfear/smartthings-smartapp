import React, {useState} from 'react';
import {Popover} from 'react-tiny-popover';
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

const DeviceIcon = styled.div`
    font-size: larger;
`;

const DeviceContainer = styled.button`
    min-width: 3rem;
    min-height: 3rem;
    display: flex;
    flex: 1;
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

const Device: React.FC<IDeviceProps> = ({device, deviceType}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const deviceComponent = deviceType === 'Switch' ? (
    <LightContainer
      onMouseEnter={() => setPopoverOpen(true)}
      onMouseLeave={() => setPopoverOpen(false)}
      onTouchStart={() => setPopoverOpen(true)}
      onTouchEnd={() => setPopoverOpen(false)}
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
      onMouseEnter={() => setPopoverOpen(true)}
      onMouseLeave={() => setPopoverOpen(false)}
      onTouchStart={() => setPopoverOpen(true)}
      onTouchEnd={() => setPopoverOpen(false)}
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
      onMouseEnter={() => setPopoverOpen(true)}
      onMouseLeave={() => setPopoverOpen(false)}
      onTouchStart={() => setPopoverOpen(true)}
      onTouchEnd={() => setPopoverOpen(false)}
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

  return (
    <Popover
      isOpen={popoverOpen}
      positions={['top', 'left']} // if you'd like, you can limit the positions
      padding={10} // adjust padding here!
      reposition={false} // prevents automatic readjustment of content position that keeps your popover content within its parent's bounds
      onClickOutside={() => setPopoverOpen(false)} // handle click events outside of the popover/target here!
      content={() => (
        <DeviceTitle>
          {device.label}
        </DeviceTitle>
      )}
    >
      {deviceComponent}
    </Popover>
  );
};

export type DeviceType = 'Switch' | 'Lock' | 'Motion';

export interface IDeviceProps {
  device: IDevice;
  deviceType: DeviceType;
}

export default Device;