import React, {useMemo, useRef, useState} from 'react';
import {DropTargetMonitor, useDrop} from 'react-dnd';
import styled from 'styled-components';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';
import {useDeviceContext} from '../store/DeviceContextStore';

const dimLevelMin = 5;
const dimLevelMax = 95;
const negative100Percent = -100;

const DimLevelSliderContainer = styled.div`
  height: 80%;
  width: 50%;
  border-radius: 2rem;
  position: relative;
  overflow: hidden;
  transition: all 0.5s;
  will-change: transform;
  box-shadow: 0 0 5px #e76f51;
`;

const DimLevelSlider = styled.div<{progressPercentage: number}>`
  position: absolute;
  height: 100%;
  width: 100%;
  content: "";
  background-color: #e76f51;
  left: 0;
  right: 0;
  bottom: ${props => negative100Percent + props.progressPercentage}%;
  border-radius: inherit;
  display: flex;
  justify-content: center;
  align-items:center;
  color: white;
  font-family: sans-serif;
`;

const BleedingControlActionContainer = styled(ControlActionContainer)`
  flex-grow: 1;
`;

const ActionDeviceDim: React.FC<IActionDeviceDimProps> = ({words}) => {
  const {deviceData} = useDeviceContext();
  
  const [dimLevelSliderValue, setDimLevelSliderValue] = useState(0);

  // TODO: this whole state can go someday...?
  // eslint-disable-next-line no-console
  console.log('words', words, dimLevelSliderValue);

  const onDrop = useMemo(() => async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
    // component: 'main',
    // capability: 'switchLevel',
    // command: 'setLevel',
    // arguments: [{integer: switchLevel}, {integer: rateLevel}]

    // this shouldn't happen, but just incase we drop and have never updated state dont unintentionally dim light to '0', rather do nothing
    if (dimLevelSliderValue <= 0) {
      return item;
    }

    try {
      if (item.type === IDragAndDropType.Device) {
        // eslint-disable-next-line no-magic-numbers
        await executeDeviceCommand(item.id, 'switchLevel', 'setLevel', 'main', [dimLevelSliderValue, 50]);
      } else if (item.type === IDragAndDropType.Power) {
        const roomSwitches = deviceData.switches.filter(d => d.roomId === item.id);
        // TODO: this can be a single call if we expose the API properly
        // eslint-disable-next-line no-magic-numbers
        await Promise.all(roomSwitches.map(s => executeDeviceCommand(s.deviceId, 'switchLevel', 'setLevel', 'main', [dimLevelSliderValue, 50])));
      }
      return item;
    } finally {
      setDimLevelSliderValue(0);
    }
  // TODO: is this right, do i redefine this func everytime this state var changes?  or can i pass it into a more stable memo?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimLevelSliderValue]);

  const sliderRef = useRef<HTMLInputElement>(null);

  const onDragHover = (_: IDragAndDropItem, monitor: DropTargetMonitor<IDragAndDropItem, IDragAndDropItem>): void => {
    if (!monitor.canDrop() || !sliderRef.current) {
      return;
    }

    // take mouse-y - container-top / container-height for '%' of vertical location in container, then min/max it in the allowed range
    const dropTargetBoundingRect = sliderRef.current.getBoundingClientRect();
    const yScaleOffset = 100 -
      Math.max(
        Math.min(
          dimLevelMax,
          Math.round(
            ((monitor.getClientOffset()!.y - Math.round(dropTargetBoundingRect.top)) / dropTargetBoundingRect.height) * 100
          )
        ),
        dimLevelMin
      );

    setDimLevelSliderValue(yScaleOffset);
  };

  // create a standard hook config from factory like elsewhere, then spread additional 'hover' prop onto it
  const dropHookConfig = createDropConfig(onDrop, [IDragAndDropType.Power, IDragAndDropType.Device]);
  const [collectedProps, drop] = useDrop(() => ({...dropHookConfig, hover: onDragHover}));

  const leftControl = (
    <BleedingControlActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      {...collectedProps}
    >
      <DimLevelSliderContainer ref={sliderRef}>
        <DimLevelSlider progressPercentage={dimLevelSliderValue} />
      </DimLevelSliderContainer>
    </BleedingControlActionContainer>
  );
  
  return leftControl;
};

export interface IActionDeviceDimProps {
  words: string;
}

export default ActionDeviceDim;