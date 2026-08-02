import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropType, type IDragAndDropItem} from '../factories/dragAndDropFactory';
import {ActionLogo, ActionStatus, ControlActionContainer} from '../factories/styleFactory';
import executeScene from '../operations/executeScene';
import {revalidateDeviceDataForLocation} from '../store/DeviceContextStore';
import {useLocationContextStore} from '../store/LocationContextStore';

const ActionSceneExecute: React.FC<IActionSceneExecuteProps> = ({words}) => {
  const locationId = useLocationContextStore(s => s.locationId);

  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    if (item.type === IDragAndDropType.Scene) {
      await executeScene(locationId!, item.id);
      await revalidateDeviceDataForLocation(locationId!);
    }
    return item;
  };

  const [collectedProps, drop] = useDrop(() => createDropConfig(onDrop, [IDragAndDropType.Scene]));

  const leftControl = (
    <ControlActionContainer
      rgb={global.palette.control.rgb.scene}
      ref={drop}
      {...collectedProps}
    >
      <ActionLogo>
        ▶️
      </ActionLogo>
      <ActionStatus>
        {words}
      </ActionStatus>
    </ControlActionContainer>
  );

  return leftControl;
};

export interface IActionSceneExecuteProps {
  words: string;
}

export default ActionSceneExecute;
