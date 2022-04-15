import React, {useState} from 'react';
import {Popover} from 'react-tiny-popover';
import styled from 'styled-components';
import {Room as IRoom} from '@smartthings/core-sdk';
import {ControlContainer, ControlIcon} from '../factories/styleFactory';
import {IActiveControl} from '../types/interfaces';

const DeviceTitle = styled.div`
  font-size: larger;
  font-weight: 700;
`;

const Power: React.FC<IPowerProps> = ({room, isPowerOn, setActiveDevice}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const deviceComponent = (
    <ControlContainer
      rgb={isPowerOn ? 'E3E624' : 'cccccc'}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      onMouseEnter={() => setActiveDevice({name: room.name!, id: room.roomId!})}
      onMouseLeave={() => setActiveDevice(null)}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      onTouchStart={() => setActiveDevice({name: room.name!, id: room.roomId!})}
      onTouchEnd={() => setActiveDevice(null)}
    >
      <ControlIcon>
        🔨
      </ControlIcon>
    </ControlContainer>
  );

  return (
    <Popover
      isOpen={popoverOpen}
      positions={['top', 'left']} // if you'd like, you can limit the positions
      padding={10} // adjust padding here!
      reposition={false} // prevents automatic readjustment of content position that keeps your popover content within its parent's bounds
      onClickOutside={() => setPopoverOpen(false)} // handle click events outside of the popover/target here!
      content={() => (
        <DeviceTitle>
          {room.name}
        </DeviceTitle>
      )}
    >
      {deviceComponent}
    </Popover>
  );
};

export interface IPowerProps {
  room: IRoom;
  isPowerOn: boolean;
  setActiveDevice: (value: IActiveControl | null) => void;
}

export default Power;