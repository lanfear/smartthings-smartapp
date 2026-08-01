import React from 'react';
import AceEditor from 'react-ace';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import global from '../constants/global';
import {
  DashboardTitle,
  DashboardSubTitle,
  DashboardCardGrid,
  DashboardCard,
  DashboardCardTitle,
  DashboardCardBadge,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue,
  DashboardCardActions,
  DashboardActionButton,
  GlassPanel
} from '../factories/styleFactory';
import {revalidateDeviceDataForLocation, useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import type {IApp, IRule} from '../types/sharedContracts';

const DashboardRuleTitle = styled(DashboardCardTitle)<{matchesInstalledApp: boolean}>`
  color: ${props => props.matchesInstalledApp ? '#7CE624' : '#E66B24'};
`;

const RuleModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${global.zIndex.header + 10};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RuleModalBackground = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
`;

const RuleModalContent = styled(GlassPanel)`
  position: relative;
  width: min(90vw, 900px);
  max-height: 85vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
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

// rule names are generated as 'app-<installedAppId>-rule' (the combined day/night/idle rule) or
// 'app-<installedAppId>-transition-rule' - the suffix is the only thing distinguishing the two, and it's
// exactly the part that gets cut off once the name is truncated to fit the card title
const getRuleType = (name: string): 'Transition' | 'Main' => name.endsWith('-transition-rule') ? 'Transition' : 'Main';

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
    await revalidateDeviceDataForLocation(location);
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
      <DashboardSubTitle>
        {deviceData.locationId}
      </DashboardSubTitle>
      <DashboardCardGrid>
        {deviceData.rules.sort((a, b) => a.name.localeCompare(b.name)).map(r => {
          const matchingApp = findAppMatchingRule(r.name);
          const ruleType = getRuleType(r.name);
          return (
            <DashboardCard key={`rules-${r.id}`}>
              <DashboardCardBadge rgb={ruleType === 'Transition' ? global.palette.control.rgb.scene : global.palette.control.rgb.inactive}>
                {ruleType}
              </DashboardCardBadge>
              <DashboardRuleTitle matchesInstalledApp={!!matchingApp}>
                {r.name}
              </DashboardRuleTitle>
              <DashboardCardBody>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('dashboard.rule.header.ruleId')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {r.id}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('dashboard.rule.header.devices')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {findRuleDeviceNames(r).join(', ')}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('dashboard.rule.header.ownerId')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {matchingApp?.displayName ?? '(rogue rule)'}
                  </DashboardCardFieldValue>
                </DashboardCardField>
              </DashboardCardBody>
              <DashboardCardActions>
                <DashboardActionButton
                  rgb={global.palette.control.rgb.app}
                  onClick={() => openRule(r.id)}
                >
                  {t('dashboard.rule.action.show')}
                </DashboardActionButton>
                <DashboardActionButton
                  rgb={global.palette.control.rgb.locked}
                  onClick={() => {
                    void deleteRule(deviceData.locationId, r.id);
                  }}
                >
                  {t('dashboard.rule.action.delete')}
                </DashboardActionButton>
              </DashboardCardActions>
            </DashboardCard>
          );
        })}
      </DashboardCardGrid>
      {modalOpen && (
        <RuleModalOverlay>
          <RuleModalBackground onClick={() => setModalOpen(false)} />
          <RuleModalContent>
            <AceEditor
              width="100%"
              height="70vh"
              mode="json"
              theme="monokai"
              name="textarea"
              value={JSON.stringify(activeRule, undefined, 2)}
              editorProps={{$blockScrolling: true}}
              setOptions={{fontSize: 15}}
            />
            <DashboardCardActions>
              <DashboardActionButton
                aria-label="close"
                onClick={() => setModalOpen(false)}
              >
                {t('dashboard.rule.action.close')}
              </DashboardActionButton>
            </DashboardCardActions>
          </RuleModalContent>
        </RuleModalOverlay>
      )}
    </>
  );
  /* eslint-enable no-undefined */
};

export default DashboardRules;
