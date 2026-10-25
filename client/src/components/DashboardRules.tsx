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
  DashboardChipToggle,
  GlassPanel
} from '../factories/styleFactory';
import {revalidateDeviceDataForLocation, useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import type {IApp, IRule, IRuleHealth, IRuleHealthStatus, Nullable} from '../types/sharedContracts';

type RuleFilter = 'all' | 'attention' | 'ok' | 'external';

const attentionStatuses: IRuleHealthStatus[] = ['staleDuplicate', 'orphaned', 'untracked'];
const ruleFilters: RuleFilter[] = ['all', 'attention', 'ok', 'external'];
const shortIdLength = 8;

// status pills always pair the color with an icon + label, so the state never relies on color alone
const healthStyle: Record<IRuleHealthStatus, {icon: string; background: string; color: string}> = {
  ok: {icon: '✓', background: '#0ca30c', color: '#ffffff'},
  staleDuplicate: {icon: '⚠', background: '#fab219', color: '#0b0b0b'},
  orphaned: {icon: '✕', background: '#d03b3b', color: '#ffffff'},
  untracked: {icon: '?', background: '#898781', color: '#ffffff'},
  external: {icon: '•', background: 'transparent', color: '#52514e'}
};

const DashboardRuleTitle = styled(DashboardCardTitle)<{matchesInstalledApp: boolean}>`
  color: ${props => props.matchesInstalledApp ? '#7CE624' : '#E66B24'};
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const HealthRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const HealthPill = styled.span<{status: IRuleHealthStatus}>`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: ${props => healthStyle[props.status].background};
  color: ${props => healthStyle[props.status].color};
  border: 1px solid ${props => props.status === 'external' ? '#c3c2b7' : 'transparent'};
`;

const HealthReason = styled.span`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const MissingRulesNotice = styled(GlassPanel)`
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  border-left: 4px solid #fab219;
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

// location data cached in localStorage from before rule health existed won't have these yet - treat it as unknown
// (no pill) rather than crashing, until the next real fetch replaces the stale cache entry
const getRuleHealth = (rule: IRule): Nullable<IRuleHealth> => (rule as Partial<IRule>).health ?? null;
const getMissingRuleIds = (app: IApp): string[] => (app as Partial<IApp>).missingRuleIds ?? [];

const shortId = (id: string): string => `${id.slice(0, shortIdLength)}…`;

const matchesFilter = (health: Nullable<IRuleHealth>, filter: RuleFilter): boolean => {
  switch (filter) {
    case 'attention':
      return !!health && attentionStatuses.includes(health.status);
    case 'ok':
      return health?.status === 'ok';
    case 'external':
      return health?.status === 'external';
    default:
      return true;
  }
};

const DashboardRules: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [activeRule, setActiveRule] = React.useState<Nullable<IRule>>(null);
  const [filter, setFilter] = React.useState<RuleFilter>('all');

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

  const getOwnerName = (rule: IRule, health: Nullable<IRuleHealth>): string => {
    if (health?.installedAppName) {
      return health.installedAppName;
    }
    if (health?.status === 'orphaned') {
      return t('dashboard.rule.health.owner.uninstalled');
    }
    if (health?.status === 'external') {
      return t('dashboard.rule.health.owner.external');
    }
    return findAppMatchingRule(rule.name)?.displayName ?? '(rogue rule)';
  };

  const getHealthReason = (health: IRuleHealth): Nullable<string> => {
    switch (health.status) {
      case 'staleDuplicate':
        return t('dashboard.rule.health.reason.staleDuplicate', {app: health.installedAppName, kept: health.currentRuleIds.map(shortId).join(', ') || '—'});
      case 'orphaned':
        return t('dashboard.rule.health.reason.orphaned');
      case 'untracked':
        return t('dashboard.rule.health.reason.untracked', {app: health.installedAppName});
      case 'external':
        return t('dashboard.rule.health.reason.external');
      default:
        return null;
    }
  };

  const rulesWithHealth = deviceData.rules.map(r => ({rule: r, health: getRuleHealth(r)}));
  const filterCounts = Object.fromEntries(ruleFilters.map(f => [f, rulesWithHealth.filter(({health}) => matchesFilter(health, f)).length])) as Record<RuleFilter, number>;
  // rules that need attention first, then by name
  const visibleRules = rulesWithHealth
    .filter(({health}) => matchesFilter(health, filter))
    .sort((a, b) => Number(matchesFilter(b.health, 'attention')) - Number(matchesFilter(a.health, 'attention')) || a.rule.name.localeCompare(b.rule.name));
  const appsWithMissingRules = deviceData.apps.filter(a => getMissingRuleIds(a).length > 0);

  /* eslint-disable no-undefined */
  return (
    <>
      <DashboardTitle>
        {t('dashboard.rule.sectionName')}
      </DashboardTitle>
      <DashboardSubTitle>
        {deviceData.locationId}
      </DashboardSubTitle>
      <FilterRow
        role="group"
        aria-label={t('dashboard.rule.health.filter.label')}
      >
        {ruleFilters.map(f => (
          <DashboardChipToggle
            key={f}
            selected={f === filter}
            aria-pressed={f === filter}
            rgb={f === 'attention' && filterCounts.attention > 0 ? global.palette.control.rgb.rule : global.palette.control.rgb.scene}
            onClick={() => {
              setFilter(f);
            }}
          >
            {t(`dashboard.rule.health.filter.${f}`, {count: filterCounts[f]})}
          </DashboardChipToggle>
        ))}
      </FilterRow>
      {appsWithMissingRules.map(a => (
        <MissingRulesNotice key={`missing-${a.installedAppId}`}>
          {t('dashboard.rule.health.missing', {app: a.displayName, count: getMissingRuleIds(a).length, ids: getMissingRuleIds(a).map(shortId).join(', ')})}
        </MissingRulesNotice>
      ))}
      <DashboardCardGrid>
        {visibleRules.map(({rule: r, health}) => {
          const ruleType = getRuleType(r.name);
          const reason = health ? getHealthReason(health) : null;
          return (
            <DashboardCard key={`rules-${r.id}`}>
              <DashboardCardBadge rgb={ruleType === 'Transition' ? global.palette.control.rgb.scene : global.palette.control.rgb.inactive}>
                {ruleType}
              </DashboardCardBadge>
              <DashboardRuleTitle matchesInstalledApp={health ? health.status === 'ok' : !!findAppMatchingRule(r.name)}>
                {r.name}
              </DashboardRuleTitle>
              {health && (
                <HealthRow>
                  <HealthPill status={health.status}>
                    <span aria-hidden="true">
                      {healthStyle[health.status].icon}
                    </span>
                    {t(`dashboard.rule.health.status.${health.status}`)}
                  </HealthPill>
                  {reason && (
                    <HealthReason>
                      {reason}
                    </HealthReason>
                  )}
                </HealthRow>
              )}
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
                    {getOwnerName(r, health)}
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
