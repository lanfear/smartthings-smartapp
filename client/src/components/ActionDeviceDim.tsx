import React, {useMemo, useRef, useState} from 'react';
import {useDrop, type DropTargetMonitor} from 'react-dnd';
import styled from 'styled-components';
import global from '../constants/global';
import {createDropConfig, IDragAndDropType, type IDragAndDropItem} from '../factories/dragAndDropFactory';
import {SliderActionContainer, SliderFill, SliderTrack} from '../factories/styleFactory';
import executeDeviceCommand from '../operations/executeDeviceCommand';
import {useDeviceData} from '../store/DeviceContextStore';
import type {IResponseSwitches} from '../types/sharedContracts';

const dimLevelMin = 5;
const dimLevelMax = 95;

const DimLevelUpDownArrowContainer = styled.div`
  display: flex;
  font-size: 3rem;
`;

const dimSliderColor = '#e76f51';

export const dimAcceptTypes = [IDragAndDropType.Power, IDragAndDropType.Device];

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
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      await executeDeviceCommand(item.id, 'switchLevel', 'setLevel', 'main', [dimLevelSliderValue, 50]);
    } else if (item.type === IDragAndDropType.Power) {
      const roomSwitches = allSwitches.filter(d => d.roomId === item.id);
      // TODO: this can be a single call if we expose the API properly
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      await Promise.all(roomSwitches.map(s => executeDeviceCommand(s.deviceId, 'switchLevel', 'setLevel', 'main', [dimLevelSliderValue, 50])));
    }
    return item;
  } finally {
    setDimLevelSliderValue(0);
  }
};

const ActionDeviceDim: React.FC = () => {
  const deviceData = useDeviceData();

  const [dimLevelSliderValue, setDimLevelSliderValue] = useState(0);

  const sliderRef = useRef<HTMLInputElement>(null);

  const onDragHover = (_: IDragAndDropItem, monitor: DropTargetMonitor<IDragAndDropItem, IDragAndDropItem>): void => {
    if (!monitor.canDrop() || !sliderRef.current) {
      return;
    }

    // take mouse-y - container-top / container-height for '%' of vertical location in container, then min/max it in the allowed range
    const dropTargetBoundingRect = sliderRef.current.getBoundingClientRect();
    const yScaleOffset = 100
      - Math.max(
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
    return {...(createDropConfig(onDrop, dimAcceptTypes)), hover: onDragHover};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimLevelSliderValue]);

  const [collectedProps, drop] = useDrop(() => dropHookConfig, [dimLevelSliderValue]);

  const leftControl = (
    <SliderActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={node => {
        drop(node);
      }}
      progressPercentage={dimLevelSliderValue}
      {...collectedProps}
    >
      <DimLevelUpDownArrowContainer>
        🔺
      </DimLevelUpDownArrowContainer>
      <SliderTrack
        className="dim-level-slider-container"
        ref={sliderRef}
        fillColor={dimSliderColor}
      >
        <SliderFill fillColor={dimSliderColor} />
      </SliderTrack>
      <DimLevelUpDownArrowContainer>
        🔻
      </DimLevelUpDownArrowContainer>
    </SliderActionContainer>
  );

  return leftControl;
};

export default ActionDeviceDim;
