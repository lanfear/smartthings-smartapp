import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {DashboardTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceContext} from '../store/DeviceContextStore';
import {IApp} from '../types/sharedContracts';

const DashboardRuleGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardRuleLineItemGrid = styled.div`
    display: grid;
    grid-template-areas:
      "name id   status app  manage"
      "rule rule rule   rule rule";
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: 1fr max-content;
    gap: ${global.measurements.dashboardGridGap};
`;

const DashboardRuleHeader = styled(DashboardGridColumnHeader) <{ gridArea: string }>`
  grid-area: ${props => props.gridArea};
`;

const DashboardRuleContent = styled.span<{ gridArea: string }>`
  grid-area: ${props => props.gridArea};
`;

const DashboardRuleName = styled.span<{ matchesInstalledApp: boolean }>`
  grid-area: 'name';
  color: ${props => props.matchesInstalledApp ? 'green' : 'red'};
`;

const DashboardRuleDataContent = styled(DashboardRuleContent)`
  grid-area: ${props => props.gridArea};
  font-family: monospace;
  white-space: pre;
  overflow: hidden;
`;

const DashboardRules: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceContext();
  // const [existingAppList, setExistingAppList] = React.useState<Record<string, string>>({});

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? ''; // empty location id should not happen

  const findAppMatchingRule = (ruleName: string): IApp|undefined => deviceData.apps.find(a => !!ruleName.match(new RegExp(`.*${a.installedAppId}.*`, 'i')));

  const deleteRule = async (location: string, ruleId: string): Promise<void> => {
    await fetch(`${process.env.REACT_APP_APIHOST as string}/location/${location}/rule/${ruleId}`, {method: 'DELETE'});
  };

  /* eslint-disable no-undefined */
  return (
    <>
      <DashboardTitle>
        {locationId}
      </DashboardTitle>
      <DashboardRuleGrid>
        <DashboardRuleLineItemGrid>
          <DashboardRuleHeader gridArea="name">
            {t('dashboard.rule.header.name')}
          </DashboardRuleHeader>
          <DashboardRuleHeader gridArea="id">
            {t('dashboard.rule.header.ruleId')}
          </DashboardRuleHeader>
          <DashboardRuleHeader gridArea="status">
            {t('dashboard.rule.header.status')}
          </DashboardRuleHeader>
          <DashboardRuleHeader gridArea="app">
            {t('dashboard.rule.header.ownerId')}
          </DashboardRuleHeader>
          <DashboardRuleHeader gridArea="manage">
            {t('dashboard.rule.header.manage')}
          </DashboardRuleHeader>
        </DashboardRuleLineItemGrid>
        {deviceData && deviceData.rules?.map(s => (
          <React.Fragment key={`rules-${s.id}`}>
            <DashboardRuleLineItemGrid>
              <DashboardRuleName matchesInstalledApp={!!findAppMatchingRule(s.name)}>
                {s.name}
              </DashboardRuleName>
              <DashboardRuleContent gridArea="id">
                {s.id}
              </DashboardRuleContent>
              <DashboardRuleContent gridArea="status">
                {s.executionLocation}
              </DashboardRuleContent>
              <DashboardRuleContent gridArea="app">
                {findAppMatchingRule(s.name)?.displayName ?? '(rogue rule)'}
              </DashboardRuleContent>
              <DashboardRuleContent gridArea="manage">
                <button onClick={() => deleteRule(locationId, s.id)}>
                  DELETE
                </button>
              </DashboardRuleContent>
              <DashboardRuleDataContent gridArea="rule">
                {JSON.stringify(s, undefined, 2)}
              </DashboardRuleDataContent>
            </DashboardRuleLineItemGrid>
          </React.Fragment>
        ))}
      </DashboardRuleGrid>
    </>
  );
  /* eslint-enable no-undefined */
};

export default DashboardRules;
