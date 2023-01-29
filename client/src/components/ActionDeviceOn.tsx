import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';
import {useDeviceContext} from '../store/DeviceContextStore';

const ActionDeviceOn: React.FC<IActionDeviceOnProps> = () => {
  const {deviceData} = useDeviceContext();

  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    if (item.type === IDragAndDropType.Device) {
      await executeDeviceCommand(item.id, 'switch', 'on');
    } else if (item.type === IDragAndDropType.Power) {
      const roomSwitches = deviceData.switches.filter(d => d.roomId === item.id);
      // TODO: this can be a single call if we expose the API properly
      await Promise.all(roomSwitches.map(s => executeDeviceCommand(s.deviceId, 'switch', 'on')));
    }
    return item;
  };

  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop, [IDragAndDropType.Power, IDragAndDropType.Device]));
  const leftControl = (
    <ControlActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      {...collectedProps}
    >
      <ControlIcon>
          ✅
      </ControlIcon>
      <ControlStatus>
        On
      </ControlStatus>
    </ControlActionContainer>
  );

  return leftControl;
};

export interface IActionDeviceOnProps {
  words: string;
}

export default ActionDeviceOn;
