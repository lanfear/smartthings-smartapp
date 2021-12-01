import React, {useState} from 'react';
import {Popover} from 'react-tiny-popover';
import styled from 'styled-components';
import {Room as IRoom} from '@smartthings/core-sdk';

const DeviceTitle = styled.div`
  font-size: larger;
  font-weight: 700;
`;

const DeviceIcon = styled.div`
  font-size: larger;
`;

const DeviceContainer = styled.button`
  height: 3rem;
  width: 3rem;
  display: flex;
  flex: none;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: space-evenly;
  border: 1px solid gray;
  border-radius: 4px;
`;

const PowerContainer = styled(DeviceContainer) <{ isPowerOn: boolean }>`
  ${props => props.isPowerOn ? `
  box-shadow:
      0px 0px 10px 2px yellow, 
      inset 0px 0px 20px 15px yellow;
  ` : ''}
`;

const Power: React.FC<IPowerProps> = ({room, isPowerOn}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const deviceComponent = (
    <PowerContainer
      onMouseEnter={() => setPopoverOpen(true)}
      onMouseLeave={() => setPopoverOpen(false)}
      onTouchStart={() => setPopoverOpen(true)}
      onTouchEnd={() => setPopoverOpen(false)}
      isPowerOn={isPowerOn}
    >
      <DeviceIcon>
        🔨
      </DeviceIcon>
    </PowerContainer>
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
}

export default Power;