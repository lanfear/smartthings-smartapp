import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import executeRuleControl from '../operations/executeRuleControl';
import {useDeviceContext} from '../store/DeviceContextStore';
import {IRuleComponentType} from '../types/sharedContracts';

const ActionRuleDisable: React.FC<IActionRuleDisableProps> = ({words}) => {
  const {deviceData} = useDeviceContext();

  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
  // eslint-disable-next-line no-console
    console.log('item dropped', item);

    if (item.type === IDragAndDropType.Rule) {
      await executeRuleControl(deviceData.locationId, item.id, item.subtype as IRuleComponentType, false);
    }
    return item;
  };

  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop, [IDragAndDropType.Rule]));
  
  const leftControl = (
    <ControlActionContainer
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
    </ControlActionContainer>
  );
  
  return leftControl;
};

export interface IActionRuleDisableProps {
  words: string;
}

export default ActionRuleDisable;