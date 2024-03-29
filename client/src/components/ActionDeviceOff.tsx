import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ActionLogo, ControlStatus} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';
import {useDeviceContext} from '../store/DeviceContextStore';

const ActionDeviceOff: React.FC<IDeviceOffActionProps> = ({words}) => {
  const {deviceData} = useDeviceContext();

  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    if (item.type === IDragAndDropType.Device) {
      await executeDeviceCommand(item.id, 'switch', 'off');
    } else if (item.type === IDragAndDropType.Power) {
      const roomSwitches = deviceData.switches.filter(d => d.roomId === item.id);
      // TODO: this can be a single call if we expose the API properly
      await Promise.all(roomSwitches.map(s => executeDeviceCommand(s.deviceId, 'switch', 'off')));
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
      <ActionLogo fontSize="larger">
          ❎
      </ActionLogo>
      <ControlStatus>
        {words}
      </ControlStatus>
    </ControlActionContainer>
  );

  return leftControl;
};

export interface IDeviceOffActionProps {
  words: string;
}

export default ActionDeviceOff;
