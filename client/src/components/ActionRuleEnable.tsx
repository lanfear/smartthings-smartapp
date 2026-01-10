import React, {useMemo} from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ActionLogo, ControlStatus} from '../factories/styleFactory';
import executeRuleControl from '../operations/executeRuleControl';
import {IRuleComponentType} from '../types/sharedContracts';
import {useLocationContextStore} from '../store/LocationContextStore';

const ActionRuleEnable: React.FC<IActionRuleEnableProps> = ({words}) => {
  const locationId = useLocationContextStore(s => s.locationId);

  const dropHookConfig = useMemo(() => {
    const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
      if (item.type === IDragAndDropType.App) {
        await executeRuleControl(locationId!, item.id, 'all', true);
      }
      if (item.type === IDragAndDropType.Rule) {
        await executeRuleControl(locationId!, item.id, item.subtype as IRuleComponentType, true);
      }
      return item;
    };

    return {...(createDropConfig(onDrop, [IDragAndDropType.Rule, IDragAndDropType.App]))};
  }, [locationId]);

  const [collectedProps, drop] = useDrop(() => dropHookConfig, [locationId]);

  const leftControl = (
    <ControlActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      {...collectedProps}
    >
      <ActionLogo fontSize="x-large">
        ▶
      </ActionLogo>
      <ControlStatus>
        {words}
      </ControlStatus>
    </ControlActionContainer>
  );

  return leftControl;
};

export interface IActionRuleEnableProps {
  words: string;
}

export default ActionRuleEnable;
