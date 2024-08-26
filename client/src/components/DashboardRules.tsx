import React from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import global from '../constants/global';
import {DashboardTitle, DashboardGridColumnHeader} from '../factories/styleFactory';
import {useDeviceContext} from '../store/DeviceContextStore';
import {IApp, IRule} from '../types/sharedContracts';

const DashboardRuleGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(100px, auto);
`;

const DashboardRuleLineItemGrid = styled.div`
    display: grid;
    grid-template-areas:
      "name id   status app  manage";
    grid-template-columns: repeat(5, 1fr);
    gap: ${global.measurements.dashboardGridGap};
`;

const DashboardRuleHeader = styled(DashboardGridColumnHeader)<{gridArea: string}>`
  grid-area: ${props => props.gridArea};
`;

const DashboardRuleContent = styled.span<{gridArea: string}>`
  grid-area: ${props => props.gridArea};
  display: flex;
  justify-content: space-evenly;
`;

const DashboardRuleName = styled.span<{matchesInstalledApp: boolean}>`
  grid-area: 'name';
  color: ${props => props.matchesInstalledApp ? 'green' : 'red'};
`;

const DashboardModal = styled.div`
`;

const DashboardModalBackground = styled.div`
  backdrop-filter: blur(10px);
`;

const DashboardModalContent = styled.div`
`;

const DashboardModalButton = styled.button`
`;

const DashboardRules: React.FC = () => {
  const {t} = useTranslation();
  const {deviceData} = useDeviceContext();
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [activeRule, setActiveRule] = React.useState<IRule | null>(null);
  // const [existingAppList, setExistingAppList] = React.useState<Record<string, string>>({});

  const routeInfo = useParams<{locationId: string}>();
  const locationId = routeInfo.locationId ?? ''; // empty location id should not happen

  const findAppMatchingRule = (ruleName: string): IApp | undefined => deviceData.apps.find(a => !!ruleName.match(new RegExp(`.*${a.installedAppId}.*`, 'i')));

  const deleteRule = async (location: string, ruleId: string): Promise<void> => {
    await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST!}/location/${location}/rule/${ruleId}`, {method: 'DELETE'});
  };

  const openRule = (ruleId: string): void => {
    setActiveRule(deviceData.rules.find(r => r.id === ruleId) ?? null);
    setModalOpen(true);
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
        {deviceData.rules.map(s => (
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
                <button onClick={() => openRule(s.id)}>
                  SHOW RULE
                </button>
                <button onClick={() => deleteRule(locationId, s.id)}>
                  DELETE
                </button>
              </DashboardRuleContent>
            </DashboardRuleLineItemGrid>
          </React.Fragment>
        ))}
      </DashboardRuleGrid>
      <DashboardModal className={modalOpen ? 'modal is-active' : 'modal'}>
        <DashboardModalBackground className="modal-background" />
        <DashboardModalContent className="modal-content">
          <AceEditor
            width="100%"
            height="80vh"
            mode="json"
            theme="monokai"
            name="textarea"
            value={JSON.stringify(activeRule, undefined, 2)}
            editorProps={{$blockScrolling: true}}
            setOptions={{fontSize: 15}}
          />
        </DashboardModalContent>
        <DashboardModalButton
          className="modal-close"
          aria-label="close"
          onClick={() => setModalOpen(false)}
        >
          Close
        </DashboardModalButton>
      </DashboardModal>
    </>
  );
  /* eslint-enable no-undefined */
};

export default DashboardRules;
