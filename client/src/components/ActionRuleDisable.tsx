import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ActionLogo, ControlStatus} from '../factories/styleFactory';
import executeRuleControl from '../operations/executeRuleControl';
import {useDeviceData} from '../store/DeviceContextStore';
import {IRuleComponentType} from '../types/sharedContracts';

const ActionRuleDisable: React.FC<IActionRuleDisableProps> = ({words}) => {
  const {deviceData} = useDeviceData();

  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    if (item.type === IDragAndDropType.App) {
      await executeRuleControl(deviceData.locationId, item.id, 'all', false);
    }
    if (item.type === IDragAndDropType.Rule) {
      await executeRuleControl(deviceData.locationId, item.id, item.subtype as IRuleComponentType, false);
    }
    return item;
  };

  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop, [IDragAndDropType.Rule, IDragAndDropType.App]));

  const leftControl = (
    <ControlActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      {...collectedProps}
    >
      <ActionLogo fontSize="x-large">
          ⏸
      </ActionLogo>
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
