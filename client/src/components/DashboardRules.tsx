import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router-dom';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import global from '../constants/global';
import {DashboardTitle, DashboardGridColumnHeader, StyledButton, FlexRowCenter} from '../factories/styleFactory';
import {useDeviceData} from '../store/DeviceContextStore';
import {IApp, IRule} from '../types/sharedContracts';
import {RouteParams} from '../App';
import getLocations from '../operations/getLocations';
import {setLocation} from '../store/LocationContextStore';

const DashboardRuleGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, auto);
    gap: ${global.measurements.dashboardGridGap};
    grid-auto-rows: minmax(75px, auto);
`;

const DashboardRuleContent = styled(FlexRowCenter)`
  justify-content: space-evenly;
`;

const DashboardRuleName = styled(FlexRowCenter)<{matchesInstalledApp: boolean}>`
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
  const {deviceData} = useDeviceData();
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [activeRule, setActiveRule] = React.useState<IRule | null>(null);
  const {locationId} = useParams<RouteParams>();

  // if you nav directly to location we have to setup location (itd be nice not to do this in each of the 4 components)
  useEffect(() => {
    if (locationId && locationId !== deviceData.locationId) {
      void (async () => {
        const locationData = (await getLocations()).find(l => l.locationId === locationId);
        if (locationData) {
          setLocation(locationId, locationData.name);
        }
      })();
    }
  }, [locationId, deviceData.locationId]);

  if (!locationId) {
    return null;
  }

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
        {deviceData.rules.map(s => (
          <React.Fragment key={`rules-${s.id}`}>
            <DashboardRuleName matchesInstalledApp={!!findAppMatchingRule(s.name)}>
              {s.name}
            </DashboardRuleName>
            <DashboardRuleContent>
              {s.id}
            </DashboardRuleContent>
            <DashboardRuleContent>
              {s.executionLocation}
            </DashboardRuleContent>
            <DashboardRuleContent>
              {findAppMatchingRule(s.name)?.displayName ?? '(rogue rule)'}
            </DashboardRuleContent>
            <DashboardRuleContent>
              <StyledButton onClick={() => openRule(s.id)}>
                  SHOW RULE
              </StyledButton>
              <StyledButton onClick={() => deleteRule(locationId, s.id)}>
                  DELETE
              </StyledButton>
            </DashboardRuleContent>
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
