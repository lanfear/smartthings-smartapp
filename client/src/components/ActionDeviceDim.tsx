import React, {useMemo, useRef, useState} from 'react';
import {DropTargetMonitor, useDrop} from 'react-dnd';
import styled from 'styled-components';
import global from '../constants/global';
import {createDropConfig, IDragAndDropItem, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlActionContainer} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';
import {useDeviceContext} from '../store/DeviceContextStore';
import {IResponseSwitches} from '../types/sharedContracts';

const dimLevelMin = 5;
const dimLevelMax = 95;
const negative100Percent = -100;

const DimLevelUpDownArrowContainer = styled.div`
  display: flex;
  font-size: x-large;
`;

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

const DimLevelSlider = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  content: "";
  background-color: #e76f51;
  left: 0;
  right: 0;
  bottom: -100%;
  border-radius: inherit;
  display: flex;
  justify-content: center;
  align-items:center;
  color: white;
  font-family: sans-serif;
  transition: all 0.15s;
`;

// slider level bottom is controlled here so we can rely on isOverCurrent also
const BleedingControlActionContainer = styled(ControlActionContainer) <{progressPercentage: number; isOverCurrent?: boolean}>`
  flex-grow: 1;

  .dim-level-slider {
    bottom: ${props => props.isOverCurrent ? negative100Percent + props.progressPercentage : negative100Percent}%;
  }
`;

const onDropStatic = async (item: IDragAndDropItem, allSwitches: IResponseSwitches, dimLevelSliderValue: number, setDimLevelSliderValue: (value: React.SetStateAction<number>) => void): Promise<IDragAndDropItem> => {
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
      const roomSwitches = allSwitches.filter(d => d.roomId === item.id);
      // TODO: this can be a single call if we expose the API properly
      // eslint-disable-next-line no-magic-numbers
      await Promise.all(roomSwitches.map(s => executeDeviceCommand(s.deviceId, 'switchLevel', 'setLevel', 'main', [dimLevelSliderValue, 50])));
    }
    return item;
  } finally {
    setDimLevelSliderValue(0);
  }
};

const ActionDeviceDim: React.FC = () => {
  const {deviceData} = useDeviceContext();

  const [dimLevelSliderValue, setDimLevelSliderValue] = useState(0);

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
  const dropHookConfig = useMemo(() => {
    const onDrop = (item: IDragAndDropItem): Promise<IDragAndDropItem> => onDropStatic(item, deviceData.switches, dimLevelSliderValue, setDimLevelSliderValue);
    return {...(createDropConfig(onDrop, [IDragAndDropType.Power, IDragAndDropType.Device])), hover: onDragHover};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimLevelSliderValue]);

  const [collectedProps, drop] = useDrop(() => dropHookConfig, [dimLevelSliderValue]);

  const leftControl = (
    <BleedingControlActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      progressPercentage={dimLevelSliderValue}
      {...collectedProps}
    >
      <DimLevelUpDownArrowContainer>
        🔺
      </DimLevelUpDownArrowContainer>
      <DimLevelSliderContainer
        className="dim-level-slider-container"
        ref={sliderRef}
      >
        <DimLevelSlider className="dim-level-slider" />
      </DimLevelSliderContainer>
      <DimLevelUpDownArrowContainer>
        🔻
      </DimLevelUpDownArrowContainer>
    </BleedingControlActionContainer>
  );

  return leftControl;
};

export default ActionDeviceDim;
