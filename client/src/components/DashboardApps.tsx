import React from 'react';
import {useTranslation} from 'react-i18next';
import {
  DashboardTitle,
  DashboardSubTitle,
  DashboardCardGrid,
  DashboardCard,
  DashboardCardTitle,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue
} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';

const DashboardApps: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();

  if (!deviceData.locationId) {
    return null;
  }

  return (
    <>
      <DashboardTitle>
        {t('dashboard.installedApp.sectionName')}
      </DashboardTitle>
      <DashboardSubTitle>
        {deviceData.locationId}
      </DashboardSubTitle>
      <DashboardCardGrid>
        {deviceData.apps.sort((a, b) => a.displayName!.localeCompare(b.displayName!)).map(a => (
          <DashboardCard key={`apps-${a.installedAppId}`}>
            <DashboardCardTitle>
              {a.displayName}
            </DashboardCardTitle>
            <DashboardCardBody>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.installedApp.header.appId')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {a.appId}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.installedApp.header.installedAppId')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {a.installedAppId}
                </DashboardCardFieldValue>
              </DashboardCardField>
              <DashboardCardField>
                <DashboardCardFieldLabel>
                  {t('dashboard.installedApp.header.lastUpdatedDate')}
                </DashboardCardFieldLabel>
                <DashboardCardFieldValue>
                  {a.lastUpdatedDate}
                </DashboardCardFieldValue>
              </DashboardCardField>
            </DashboardCardBody>
          </DashboardCard>
        ))}
      </DashboardCardGrid>
    </>
  );
};

export default DashboardApps;
