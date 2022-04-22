import React from 'react';
import {Room as IRoom} from '@smartthings/core-sdk';
import {ControlContainer, ControlIcon} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';
import global from '../constants/global';
import {useDrag} from 'react-dnd';
import {createDragObject, IDragAndDropType} from '../factories/dragAndDropFactory';

const Power: React.FC<IPowerProps> = ({room, isPowerOn, setActiveDevice}) => {
  const [collected, drag] = useDrag(() => (createDragObject(IDragAndDropType.Power, room.roomId!, room.name!)));

  return (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={isPowerOn ? `${global.palette.control.rgb.power}` : `${global.palette.control.rgb.inactive}`}
      onMouseEnter={() => setActiveDevice({name: room.name!, id: room.roomId!})}
      onMouseLeave={() => setActiveDevice(null)}
      onTouchStart={() => setActiveDevice({name: room.name!, id: room.roomId!})}
      onTouchEnd={() => setActiveDevice(null)}
    >
      <ControlIcon>
        🔨
      </ControlIcon>
    </ControlContainer>
  );
};

export interface IPowerProps {
  room: IRoom;
  isPowerOn: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default Power;