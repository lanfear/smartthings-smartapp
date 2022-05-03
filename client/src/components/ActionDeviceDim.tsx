import React from 'react';
import {useDrop} from 'react-dnd';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer, ControlIcon, ControlStatus} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';
import {useDeviceContext} from '../store/DeviceContextStore';

const ActionDeviceDim: React.FC<IActionDeviceDimProps> = ({words}) => {
  const {deviceData} = useDeviceContext();

  const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    // component: 'main',
    // capability: 'switchLevel',
    // command: 'setLevel',
    // arguments: [{integer: switchLevel}, {integer: rateLevel}]

    if (item.type === IDragAndDropType.Device) {
      // eslint-disable-next-line no-magic-numbers
      await executeDeviceCommand(item.id, 'switchLevel', 'setLevel', 'main', [50, 5000]);
    } else if (item.type === IDragAndDropType.Power) {
      const roomSwitches = deviceData.switches.filter(d => d.roomId === item.id);
      // TODO: this can be a single call if we expose the API properly
      await Promise.all(roomSwitches.map(s => executeDeviceCommand(s.deviceId, 'switchLevel', 'setLevel', JSON.stringify([{integer: 50}, {integer: 5000}]))));
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

export interface IActionDeviceDimProps {
  words: string;
}

export default ActionDeviceDim;