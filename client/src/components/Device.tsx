import React from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import {IDevice} from '../types/sharedContracts';

const Device: React.FC<IDeviceProps> = ({device, deviceType, setActiveDevice, isLocked}) => {
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
    >
      {/* <span>{t('dashboard.switch.header.deviceId')}: {device.deviceId}</span> */}
      <ControlIcon>
        {isLocked ? '💡🔒' : '💡'}
      </ControlIcon>
      <ControlStatus>
        {device.value}
      </ControlStatus>
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
      <ControlIcon>
        {device.value === 'locked' ? '🔒' : '🔓'}
      </ControlIcon>
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
    >
      {/* <span>{t('dashboard.motion.header.deviceId')}: {device.deviceId}</span> */}
      <ControlIcon>
        {device.value === 'active' ? '🏃' : '🧍'}
      </ControlIcon>
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
}

export default Device;