import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceContext} from '../store/DeviceContextStore';
import {DeviceContext, IRule} from '../types/sharedContracts';

const DashboardRuleGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardRules: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceContext();

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? ''; // empty location id should not happen

  const deleteRule = async (location: string, ruleId: string): Promise<void> => {
    await fetch(`${process.env.REACT_APP_APIHOST as string}/${location}/rule/${ruleId}`, {method: 'DELETE'});
  };

  const findRoomName = (rule: IRule): string | undefined => {
    const motionDevice = deviceData.motion.find(m =>
      rule.ruleSummary?.motionSensors.find((mm: DeviceContext): boolean => m.deviceId === mm.deviceId)
    );
    const room = deviceData.rooms.find(r => r.roomId === motionDevice?.roomId);
    return room?.name;
  };

  return (
    <>
      <DashboardTitle>
        {locationId}
      </DashboardTitle>
      <DashboardRuleGrid>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.name')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.ruleId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.status')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.ownerId')}
        </DashboardGridColumnHeader>
        <DashboardGridColumnHeader>
          {t('dashboard.rule.header.manage')}
        </DashboardGridColumnHeader>
        {deviceData && deviceData.rules?.map(s => (
          <React.Fragment key={`rules-${s.id}`}>
            <span>
              {s.name}
            </span>
            <span>
              {s.id}
            </span>
            <span>
              {s.executionLocation}
            </span>
            <span>
              {findRoomName(s)}
            </span>
            <button onClick={() => deleteRule(locationId, s.id)}>
            DELETE
            </button>
          </React.Fragment>
        ))}
      </DashboardRuleGrid>
    </>
  );
};

export default DashboardRules;
