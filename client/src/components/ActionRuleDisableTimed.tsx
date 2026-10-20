import React, {useMemo, useRef, useState} from 'react';
import {useDrop, type DropTargetMonitor} from 'react-dnd';
import styled from 'styled-components';
import global from '../constants/global';
import {createDropConfig, IDragAndDropType, type IDragAndDropItem} from '../factories/dragAndDropFactory';
import {SliderActionContainer, SliderFill, SliderTrack} from '../factories/styleFactory';
import executeRuleControl from '../operations/executeRuleControl';
import {useLocationContextStore} from '../store/LocationContextStore';
import type {IRuleComponentType} from '../types/sharedContracts';

// server treats reEnable as hours (minutes in dev), so fractional values work for sub-hour steps
const reEnableSteps: {reEnableAfter: number; label: string}[] = [
  {reEnableAfter: 0.5, label: '30m'},
  {reEnableAfter: 2, label: '2h'},
  {reEnableAfter: 4, label: '4h'},
  {reEnableAfter: 8, label: '8h'},
  {reEnableAfter: 12, label: '12h'},
  {reEnableAfter: 24, label: '24h'}
];

const noStepSelected = -1;
const timedSliderColor = `#${global.palette.control.rgb.rule}`;

export const timedDisableAcceptTypes = [IDragAndDropType.Rule, IDragAndDropType.App];

const TimedLabelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3rem;
  font-size: 1.25rem;
  font-weight: 600;
`;

// thin dividers between steps so the track reads as stepped rather than continuous
const SliderStepTick = styled.div<{bottomPercent: number}>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${props => props.bottomPercent}%;
  height: 1px;
  background: rgba(255, 255, 255, 0.35);
  pointer-events: none;
`;

const ActionRuleDisableTimed: React.FC = () => {
  const locationId = useLocationContextStore(s => s.locationId);
  const [stepIndex, setStepIndex] = useState(noStepSelected);

  const sliderRef = useRef<HTMLDivElement>(null);

  const onDragHover = (_: IDragAndDropItem, monitor: DropTargetMonitor<IDragAndDropItem, IDragAndDropItem>): void => {
    if (!monitor.canDrop() || !sliderRef.current) {
      return;
    }

    // distance from track bottom as a fraction of its height, bucketed into one of the steps (bottom = shortest)
    const dropTargetBoundingRect = sliderRef.current.getBoundingClientRect();
    const fromBottom = (dropTargetBoundingRect.bottom - monitor.getClientOffset()!.y) / dropTargetBoundingRect.height;
    setStepIndex(Math.min(reEnableSteps.length - 1, Math.max(0, Math.floor(fromBottom * reEnableSteps.length))));
  };

  const dropHookConfig = useMemo(() => {
    const onDrop = async (item: IDragAndDropItem): Promise<IDragAndDropItem> => {
      // never drop without a step, that would disable with no re-enable at all
      if (stepIndex === noStepSelected) {
        return item;
      }

      const {reEnableAfter} = reEnableSteps[stepIndex];
      try {
        if (item.type === IDragAndDropType.App) {
          await executeRuleControl(locationId!, item.id, 'all', false, reEnableAfter);
        }
        if (item.type === IDragAndDropType.Rule) {
          await executeRuleControl(locationId!, item.id, item.subtype as IRuleComponentType, false, reEnableAfter);
        }
        return item;
      } finally {
        setStepIndex(noStepSelected);
      }
    };

    return {...(createDropConfig(onDrop, timedDisableAcceptTypes)), hover: onDragHover};
  }, [locationId, stepIndex]);

  const [collectedProps, drop] = useDrop(() => dropHookConfig, [locationId, stepIndex]);

  const showStep = !!collectedProps.isOverCurrent && stepIndex !== noStepSelected;

  return (
    <SliderActionContainer
      rgb={global.palette.control.rgb.inactive}
      ref={drop}
      progressPercentage={showStep ? ((stepIndex + 1) / reEnableSteps.length) * 100 : 0}
      {...collectedProps}
    >
      <TimedLabelContainer>
        {showStep ? reEnableSteps[stepIndex].label : '💤'}
      </TimedLabelContainer>
      <SliderTrack
        ref={sliderRef}
        fillColor={timedSliderColor}
      >
        <SliderFill fillColor={timedSliderColor} />
        {reEnableSteps.slice(1).map((s, i) => (
          <SliderStepTick
            key={`timed-disable-tick-${s.label}`}
            bottomPercent={((i + 1) / reEnableSteps.length) * 100}
          />
        ))}
      </SliderTrack>
    </SliderActionContainer>
  );
};

export default ActionRuleDisableTimed;
