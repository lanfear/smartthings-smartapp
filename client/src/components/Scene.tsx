import React, {useState} from 'react';
import {useDrag} from 'react-dnd';
import global from '../constants/global';
import {createDragConfig, IDragAndDropType} from '../factories/dragAndDropFactory';
import {ControlContainer, ControlLogo, ControlStatus} from '../factories/styleFactory';
import executeScene from '../operations/executeScene';
import {revalidateDeviceDataForLocation} from '../store/DeviceContextStore';
import type {IScene} from '../types/sharedContracts';

const Scene: React.FC<ISceneProps> = ({scene, locationId}) => {
  const [executing, setExecuting] = useState(false);
  const [collected, drag] = useDrag(() => (createDragConfig(IDragAndDropType.Scene, scene.sceneId!, scene.sceneName!)));

  const handleExecute = async (): Promise<void> => {
    setExecuting(true);
    try {
      await executeScene(locationId, scene.sceneId!);
      await revalidateDeviceDataForLocation(locationId);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ControlContainer
      ref={drag}
      {...collected}
      rgb={global.palette.control.rgb.scene}
      disabled={executing}
      onClick={() => {
        void handleExecute();
      }}
    >
      <ControlLogo>
        {executing ? '⏳' : '▶️'}
      </ControlLogo>
      <ControlStatus>
        {scene.sceneName}
      </ControlStatus>
    </ControlContainer>
  );
};

export interface ISceneProps {
  scene: IScene;
  locationId: string;
}

export default Scene;
