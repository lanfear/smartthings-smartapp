import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import global from '../constants/global';
import {
  DashboardTitle,
  DashboardSubTitle,
  DashboardCardGrid,
  DashboardCard,
  DashboardCardTitle,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue,
  DashboardCardActions,
  DashboardActionButton
} from '../factories/styleFactory';
import executeScene from '../operations/executeScene';
import {revalidateDeviceDataForLocation, useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';

const DashboardScenes: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [executingSceneId, setExecutingSceneId] = useState<string | null>(null);

  if (!deviceData.locationId) {
    return null;
  }

  const handleExecuteScene = async (sceneId: string): Promise<void> => {
    setExecutingSceneId(sceneId);
    try {
      await executeScene(deviceData.locationId, sceneId);
      await revalidateDeviceDataForLocation(deviceData.locationId);
    } finally {
      setExecutingSceneId(null);
    }
  };

  return (
    <>
      <DashboardTitle>
        {t('dashboard.scene.sectionName')}
      </DashboardTitle>
      <DashboardSubTitle>
        {deviceData.locationId}
      </DashboardSubTitle>
      <DashboardCardGrid>
        {deviceData.scenes.map(s => (
          <DashboardCard key={`scene-${s.sceneId!}`}>
            <DashboardCardTitle>
              {s.sceneName}
            </DashboardCardTitle>
            <DashboardCardBody>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.sceneId')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.sceneId}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.createdBy')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.createdBy}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.createdDate')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.createdDate}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.scene.header.lastExecutedDate')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {s.lastExecutedDate}
                </DashboardCardFieldValue>
              </DashboardCardField>
            </DashboardCardBody>
            <DashboardCardActions>
              <DashboardActionButton
                rgb={global.palette.control.rgb.scene}
                disabled={executingSceneId === s.sceneId}
                onClick={() => {
                  void handleExecuteScene(s.sceneId!);
                }}
              >
                {executingSceneId === s.sceneId ? t('dashboard.scene.action.executing') : `▶ ${t('dashboard.scene.action.execute')}`}
              </DashboardActionButton>
            </DashboardCardActions>
          </DashboardCard>
        ))}
      </DashboardCardGrid>
    </>
  );
};

export default DashboardScenes;
