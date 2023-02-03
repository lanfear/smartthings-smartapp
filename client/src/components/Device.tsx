import React from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlLogo, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IDevice} from '../types/sharedContracts';

const Device: React.FC<IDeviceProps> = ({device, deviceType, setActiveDevice, isLocked, isLinkedActive, isLockedActive}) => {
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.Device, device.deviceId, device.label!)));

  return deviceType === 'Switch' ? (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={device.value === 'on' ? isLocked ? `${global.palette.control.rgb.locked}` : `${global.palette.control.rgb.switch}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
      onTouchEnd={() => setActiveDevice(null)}
      isLinkedActive={isLinkedActive}
      isLockedActive={isLockedActive}
    >
      {/* <span>{t('dashboard.switch.header.deviceId')}: {device.deviceId}</span> */}
      <ControlLogo>
        💡
      </ControlLogo>
      <ControlStatus>
        {device.value}
      </ControlStatus>
      {isLocked && (
        <ControlIcon>
          🔒
        </ControlIcon>
      )}
    </ControlContainer>
  ) : deviceType === 'Lock' ? (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={`${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
      onTouchEnd={() => setActiveDevice(null)}
    >
      {/* <span>{t('dashboard.lock.header.deviceId')}: {device.deviceId}</span> */}
      <ControlLogo>
        {device.value === 'locked' ? '🔒' : '🔓'}
      </ControlLogo>
      <ControlStatus>
        {device.value}
      </ControlStatus>
    </ControlContainer>
  ) : (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={device.value === 'active' ? `${global.palette.control.rgb.motion}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: device.label! || device.deviceId, id: device.deviceId})}
      onTouchEnd={() => setActiveDevice(null)}
      isLinkedActive={isLinkedActive}
      isLockedActive={isLockedActive}
    >
      {/* <span>{t('dashboard.motion.header.deviceId')}: {device.deviceId}</span> */}
      <ControlLogo>
        {device.value === 'active' ? '🏃' : '🧍'}
      </ControlLogo>
      <ControlStatus>
        {device.value}
      </ControlStatus>
    </ControlContainer>
  );
};

export type DeviceType = 'Switch' | 'Lock' | 'Motion';

export interface IDeviceProps {
  device: IDevice;
  deviceType: DeviceType;
  setActiveDevice: (value: IActiveControl | null) => void;
  isLocked?: boolean;
  isLinkedActive?: boolean;
  isLockedActive?: boolean;
}

export default Device;
