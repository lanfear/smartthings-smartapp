import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropType, type IDragAndDropItem} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ActionLogo, ActionStatus} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';

const ActionDeviceOn: React.FC<IActionDeviceOnProps> = ({words}) => {
  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    if (item.type === IDragAndDropType.Device) {
      await executeDeviceCommand(item.id, 'switch', 'on');
    }
    return item;
  };

  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop, [IDragAndDropType.Device]));
  const leftControl = (
    <ControlActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      {...collectedProps}
    >
      <ActionLogo>
        ✅
      </ActionLogo>
      <ActionStatus>
        {words}
      </ActionStatus>
    </ControlActionContainer>
  );

  return leftControl;
};

export interface IActionDeviceOnProps {
  words: string;
}

export default ActionDeviceOn;
