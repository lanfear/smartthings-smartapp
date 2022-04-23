import React from 'react';
import {DropTargetMonitor, useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';

const onDrop = async (item: IDragAndDropItem, monitor: DropTargetMonitor): Promise<IDragAndDropItem> => {
  await Promise.resolve();
  // eslint-disable-next-line no-console
  console.log('item dropped', item, monitor);
  return item;
};

const ActionRuleEnable: React.FC<IActionRuleEnableProps> = ({words}) => {
  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop, [IDragAndDropType.Rule]));
  
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

export interface IActionRuleEnableProps {
  words: string;
}

export default ActionRuleEnable;