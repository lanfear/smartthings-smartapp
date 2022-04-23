import React from 'react';
import {DropTargetMonitor, useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';

const onDrop = async (item: IDragAndDropItem, monitor: DropTargetMonitor): Promise<IDragAndDropItem> => {
  const response = await executeDeviceCommand(item.id, 'switch', 'on');
  // eslint-disable-next-line no-console
  console.log('item dropped', item, monitor, response);
  return item;
};

const ActionDeviceOn: React.FC<IActionDeviceOnProps> = ({words}) => {
  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop));
  
  const leftControl = (
    <ControlContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      {...collectedProps}
    >
      <ControlIcon>
          🤖
      </ControlIcon>
      <ControlStatus>
        {words}
      </ControlStatus>
    </ControlContainer>
  );
  
  return leftControl;
};

export interface IActionDeviceOnProps {
  words: string;
}

export default ActionDeviceOn;