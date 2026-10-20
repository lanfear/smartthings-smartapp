import React from 'react';
import {useDragLayer} from 'react-dnd';
import styled from 'styled-components';
import type {IDragAndDropType} from '../factories/dragAndDropFactory';
import ActionDeviceDim, {dimAcceptTypes} from './ActionDeviceDim';
import ActionDeviceOff from './ActionDeviceOff';
import ActionDeviceOn from './ActionDeviceOn';
import ActionRuleDisable from './ActionRuleDisable';
import ActionRuleDisableTimed, {timedDisableAcceptTypes} from './ActionRuleDisableTimed';
import ActionRuleEnable from './ActionRuleEnable';
import ActionSceneExecute from './ActionSceneExecute';

// buttons stack in one column with the sliders (dimmer, timed disable) sharing a full-height column beside them
const ControlsContainer = styled.div`
  height: 75vh;
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const ButtonColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SliderColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const DeviceControls: React.FC = () => {
  // the sliders accept disjoint item types, so while dragging something one of them can take, hide the other and let it own the column
  const draggingType = useDragLayer(monitor => monitor.isDragging() ? monitor.getItemType() as IDragAndDropType : null);
  const dimCanAccept = !!draggingType && dimAcceptTypes.includes(draggingType);
  const timedCanAccept = !!draggingType && timedDisableAcceptTypes.includes(draggingType);
  const showAllSliders = !dimCanAccept && !timedCanAccept;

  return (
    <ControlsContainer>
      <ButtonColumn>
        <ActionDeviceOn
          key="control-action-power-on"
          words="On"
        />
        <ActionRuleEnable
          key="control-action-rule-enable"
          words="Enable"
        />
        <ActionSceneExecute
          key="control-action-scene-execute"
          words="Play Scene"
        />
        <ActionRuleDisable
          key="control-action-rule-disable"
          words="Disable"
        />
        <ActionDeviceOff
          key="control-action-power-off"
          words="Off"
        />
      </ButtonColumn>
      <SliderColumn>
        {(showAllSliders || dimCanAccept) && (
          <ActionDeviceDim
            key="control-action-power-dim"
          />
        )}
        {(showAllSliders || timedCanAccept) && (
          <ActionRuleDisableTimed
            key="control-action-rule-disable-timed"
          />
        )}
      </SliderColumn>
    </ControlsContainer>
  );
};

export default DeviceControls;
