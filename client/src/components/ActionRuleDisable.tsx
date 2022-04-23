import React from 'react';
import {DropTargetMonitor, useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';

const onDrop = (item: IDragAndDropItem, monitor: DropTargetMonitor): IDragAndDropItem => {
  // eslint-disable-next-line no-console
  console.log('item dropped', item, monitor);
  return item;
};

const ActionRuleDisable: React.FC<IActionRuleDisableProps> = ({words}) => {
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

export interface IActionRuleDisableProps {
  words: string;
}

export default ActionRuleDisable;