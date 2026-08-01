import React from 'react';
import AceEditor from 'react-ace';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import global from '../constants/global';
import {DashboardTitle, DashboardGridColumnHeader, StyledButton, FlexRowCenter} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import type {IApp, IRule} from '../types/sharedContracts';

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

const recursiveSearch = (obj: object, keyToFind: string): string[] => {
  let result: string[] = [];
  // eslint-disable-next-line guard-for-in
  for (const key in obj) {
    if (key === keyToFind) {
      result.push((obj[key] as string[])[0]);
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result = result.concat(recursiveSearch(obj[key] as object, keyToFind));
    }
  }
  return result;
};

const findRuleDevices = (ruleData: object, keyToFind: string): string[] => recursiveSearch(ruleData, keyToFind);

const DashboardRules: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [activeRule, setActiveRule] = React.useState<IRule | null>(null);

  if (!deviceData.locationId) {
    return null;
  }

  const findAppMatchingRule = (ruleName: string): IApp | undefined => deviceData.apps.find(a => !!ruleName.match(new RegExp(`.*${a.installedAppId}.*`, 'i')));

  const findRuleDeviceNames = (ruleData: IRule): string[] => {
    const ruleDeviceIds = findRuleDevices(ruleData, 'devices');
    const matchingDevices = deviceData.switches.filter(d => ruleDeviceIds.includes(d.deviceId)).concat(
      deviceData.motion.filter(d => ruleDeviceIds.includes(d.deviceId)).concat(
        deviceData.locks.filter(d => ruleDeviceIds.includes(d.deviceId))));
    const matchedIds = matchingDevices.map(d => d.deviceId);
    const missingIds = Array.from(ruleDeviceIds.filter(id => !matchedIds.includes(id)));
    return matchingDevices.map(d => d.label!).concat(missingIds.map(id => `missing device ${id}`));
  };

  const deleteRule = async (location: string, ruleId: string): Promise<void> => {
    await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${location}/rule/${ruleId}`, {method: 'DELETE'});
  };

  const openRule = (ruleId: string): void => {
    const ruleData = deviceData.rules.find(r => r.id === ruleId) ?? null;
    setActiveRule(ruleData);
    setModalOpen(true);
  };

  /* eslint-disable no-undefined */
  return (
    <>
      <DashboardTitle>
        {t('dashboard.rule.sectionName')}
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
        {deviceData.rules.sort((a, b) => a.name.localeCompare(b.name)).map(r => (
          <React.Fragment key={`rules-${r.id}`}>
            <DashboardRuleName matchesInstalledApp={!!findAppMatchingRule(r.name)}>
              {r.name}
            </DashboardRuleName>
            <DashboardRuleContent>
              {r.id}
            </DashboardRuleContent>
            <DashboardRuleContent>
              {findRuleDeviceNames(r).join(', ')}
            </DashboardRuleContent>
            <DashboardRuleContent>
              {findAppMatchingRule(r.name)?.displayName ?? '(rogue rule)'}
            </DashboardRuleContent>
            <DashboardRuleContent>
              <StyledButton onClick={() => openRule(r.id)}>
                SHOW RULE
              </StyledButton>
              <StyledButton onClick={() => deleteRule(deviceData.locationId, r.id)}>
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
