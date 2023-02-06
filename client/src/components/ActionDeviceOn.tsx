import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ActionLogo, ControlStatus} from '../factories/styleFactory';
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
      <ActionLogo fontSize="larger">
          ✅
      </ActionLogo>
      <ControlStatus>
        {words}
      </ControlStatus>
    </ControlActionContainer>
  );

  return leftControl;
};

export interface IActionDeviceOnProps {
  words: string;
}

export default ActionDeviceOn;
