import React, {useCallback, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import {
  averageLine,
  buildDisplayGrid,
  chartInk,
  formatRelativeTime,
  formatValue,
  getOutlierKeys,
  getSeriesKey,
  getSeriesLabel,
  getSeriesStats,
  getValueStats,
  maxComparedSeries,
  pickDefaultComparedKeys,
  referenceLineDash,
  seriesPalette,
  statusColor,
  toggleSeriesSlot,
  type IHistoryRange,
  type IMeasurementGroup,
  type IMeasurementReferenceData
} from '../factories/measurementFactory';
import {readStorage, writeStorage} from '../factories/storageFactory';
import {
  DashboardCard,
  DashboardCardActions,
  DashboardCardBadge,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue,
  DashboardCardGrid,
  DashboardCardTitle,
  DashboardChipToggle,
  GlassPanel
} from '../factories/styleFactory';
import type {IMeasurementReading, IResponseMeasurementHistory, Nullable} from '../types/sharedContracts';
import MeasurementChart, {LineKey, type IChartSeries} from './MeasurementChart';
import Sparkline from './Sparkline';

type SlotMap = Record<string, number>;

interface IMeasurementGroupSectionProps {
  group: IMeasurementGroup;
  readings: IMeasurementReading[]; // current readings of just this group's sensors
  history: Nullable<IResponseMeasurementHistory>; // history of the group's measurement (any sensor - looked up by key)
  references: IMeasurementReferenceData[]; // context lines drawn over the sensors, e.g. thermostat setpoints (see group.references)
  range: IHistoryRange;
  roomNames: Map<string | undefined, string | undefined>;
  dimmed: boolean; // an older range is still on screen while the new one loads
  readingsSettled: boolean; // false while fresh readings are still loading (cached ones may be showing)
}

const dimmedOpacity = 0.55;
// v2: selections saved before the outlier-first defaults are ignored once, so everyone starts from the new defaults
const slotStorageKey = (group: IMeasurementGroup): string => `climate-compare-v2-${group.id}`;

const Section = styled.section`
  /* a little room above the header when jumped to via #anchor */
  scroll-margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: ${global.measurements.dashboardGridGap};
`;

const ChartPanel = styled(GlassPanel)<{dimmed: boolean}>`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: ${chartInk.surface};
  opacity: ${props => props.dimmed ? dimmedOpacity : 1};
  transition: opacity 0.2s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
`;

// section header between the charts - same divider-line look as the page title (DashboardTitle), one step smaller
const SectionHeader = styled.h2`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0 0;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;

  &::before {
    content: '';
    flex: 1;
    max-width: 60px;
    height: 1px;
    background: linear-gradient(to left, currentColor, transparent);
    opacity: 0.3;
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, currentColor, transparent);
    opacity: 0.3;
  }
`;

const MutedText = styled.span`
  font-size: 0.8rem;
  color: ${chartInk.secondary};
`;

const PanelHeaderActions = styled.div`
  margin-left: auto;
`;

// the shared DashboardActionButton is styled for the dark glass tiles - the chart panel is a light surface
const PanelButton = styled.button`
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${chartInk.primary};
  background: ${chartInk.surface};
  border: 1px solid ${chartInk.axis};
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: #f5f5f3;
    border-color: ${chartInk.muted};
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: ${chartInk.secondary};
  font-size: 0.9rem;
  text-align: center;
`;

const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: ${chartInk.primary};
`;

const LegendRemove = styled.button`
  border: none;
  background: none;
  padding: 0 0.15rem;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  color: ${chartInk.muted};

  &:hover {
    color: ${chartInk.primary};
  }
`;

const StatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  color: ${chartInk.primary};

  th, td {
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid ${chartInk.grid};
    text-align: right;
    white-space: nowrap;
  }

  th {
    font-weight: 600;
    color: ${chartInk.secondary};
  }

  th:first-child, td:first-child {
    text-align: left;
    white-space: normal;
  }

  td {
    font-variant-numeric: tabular-nums;
  }
`;

const SensorName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
`;

const TileValueRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

const TileValue = styled.span`
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.1;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusIcon = styled.span<{color: string}>`
  color: ${props => props.color};
`;

// rooms are named 'Floor - Room' throughout this app (see Room.tsx) - show just the room part
const getRoomDisplayName = (roomName: string | undefined): string => {
  if (!roomName) {
    return '—';
  }
  const roomParts = roomName.split(' - ');
  return roomParts.length > 1 ? roomParts[1] : roomParts[0];
};

const getStatus = (healthState: Nullable<string>): {icon: string; color: string; labelKey: string} => {
  if (healthState === 'ONLINE') {
    return {icon: '●', color: statusColor.good, labelKey: 'dashboard.climate.status.online'};
  }
  if (healthState === 'OFFLINE') {
    return {icon: '▲', color: statusColor.critical, labelKey: 'dashboard.climate.status.offline'};
  }
  return {icon: '?', color: statusColor.unknown, labelKey: 'dashboard.climate.status.unknown'};
};

// until the viewer picks, chart the current outliers plus a couple of random others (see pickDefaultComparedKeys)
const getDefaultSlots = (readings: IMeasurementReading[]): SlotMap => Object.fromEntries(pickDefaultComparedKeys(readings).map((key, i) => [key, i]));

const MeasurementGroupSection: React.FC<IMeasurementGroupSectionProps> = ({group, readings, history, references, range, roomNames, dimmed, readingsSettled}) => {
  const {t} = useTranslation();
  const {measurement} = group;
  const [storedSlots, setStoredSlots] = useState(() => readStorage<SlotMap>(slotStorageKey(group)));
  const [showTable, setShowTable] = useState(false);

  const readingKeys = useMemo(() => readings.map(getSeriesKey), [readings]);
  // the group's highest/lowest current readings get a badge on their tile
  const outlierKeys = useMemo(() => getOutlierKeys(readings), [readings]);
  const historyByKey = useMemo(() => new Map((history?.series ?? []).map(s => [getSeriesKey(s), s])), [history]);
  // the default is picked once per page load, from fresh readings: until they arrive it follows whatever is showing
  // (cached readings), then it's locked so the lines don't reshuffle on every one-minute refresh. not saved - the next
  // visit picks the outliers of that moment. once the viewer changes the selection, theirs is saved and used instead
  const liveDefaultSlots = useMemo(() => getDefaultSlots(readings), [readings]);
  const [lockedDefaultSlots, setLockedDefaultSlots] = useState<Nullable<SlotMap>>(null);
  if (lockedDefaultSlots === null && readingsSettled && readings.length > 0) {
    setLockedDefaultSlots(liveDefaultSlots);
  }
  const slots = storedSlots ?? lockedDefaultSlots ?? liveDefaultSlots;
  const comparedReadings = useMemo(() => readings.filter(r => getSeriesKey(r) in slots), [readings, slots]);

  const toggleCompared = useCallback((key: string) => {
    const next = toggleSeriesSlot(slots, key, readingKeys);
    setStoredSlots(next);
    writeStorage(slotStorageKey(group), next);
  }, [slots, readingKeys, group]);

  // what lines, the average and sparklines draw: every sensor in the group on one time axis, each holding its last
  // reading while online (see buildDisplayGrid). the average covers the whole group, whether or not a sensor is charted
  // one reference line per device reporting it (normally a single thermostat), keyed apart from the sensors
  const referenceLines = useMemo(() => references.flatMap(ref => ref.readings.flatMap(r => {
    const key = getSeriesKey(r);
    const series = ref.history?.series.find(s => getSeriesKey(s) === key);
    return series
      ? [{key: `${ref.measurement}:${key}`, label: `${t(`dashboard.climate.reference.${ref.measurement}`)} (${getSeriesLabel(r)})`, color: ref.color, reading: r, series: series}]
      : [];
  })), [references, t]);

  const grid = useMemo(() => buildDisplayGrid(
    readingKeys.flatMap(k => {
      const series = historyByKey.get(k);
      return series ? [{key: k, series: series}] : [];
    }),
    history?.since ?? 0,
    history?.until ?? 0,
    referenceLines
  ), [readingKeys, historyByKey, history, referenceLines]);
  const averageLabel = t('dashboard.climate.average.label', {count: grid.averageCount});
  const averageStats = getValueStats(grid.average);
  // offline sensors can hold a months-old value, so the current average only uses sensors that are reporting
  const currentValues = readings.filter(r => r.healthState !== 'OFFLINE').flatMap(r => (r.value === null ? [] : [r.value]));
  const currentAverage = currentValues.length ? currentValues.reduce((a, v) => a + v, 0) / currentValues.length : null;
  const hasAverage = averageStats.avg !== null;

  const chartSeries: IChartSeries[] = useMemo(() => [
    ...comparedReadings.flatMap(r => {
      const key = getSeriesKey(r);
      const values = grid.columns.get(key);
      return values ? [{key: key, label: getSeriesLabel(r), color: seriesPalette[slots[key]], values: values}] : [];
    }),
    ...referenceLines.flatMap(({key, label, color}) => {
      const values = grid.references.get(key);
      return values ? [{key: key, label: label, color: color, dash: referenceLineDash, stepped: true, values: values}] : [];
    }),
    // drawn last so the reference line sits on top of the sensor lines
    ...(hasAverage ? [{key: 'average', label: averageLabel, color: averageLine.color, dash: averageLine.dash, values: grid.average}] : [])
  ], [comparedReadings, referenceLines, grid, slots, hasAverage, averageLabel]);
  const hasChartPoints = chartSeries.some(s => s.values.some(v => v !== null));
  const unit = comparedReadings[0]?.unit ?? readings[0]?.unit ?? null;

  // sparklines share the group's x range: from where its drawable data starts (recording may not cover the whole
  // requested window yet) to now, so every card's trend lines up in time with the others
  const sparklineSince = useMemo(() => {
    const firstIdx = grid.xs.findIndex((_, i) => [...grid.columns.values()].some(c => c[i] !== null));
    return firstIdx >= 0 ? grid.xs[firstIdx] : history?.since ?? 0;
  }, [grid, history]);

  const groupName = t(`dashboard.climate.group.${group.id}`);

  return (
    <Section
      id={group.anchor}
      aria-label={groupName}
    >
      <SectionHeader>
        {groupName}
      </SectionHeader>
      <ChartPanel dimmed={dimmed}>
        <PanelHeader>
          <MutedText>
            {t('dashboard.climate.compare.count', {count: comparedReadings.length, total: readings.length})}
          </MutedText>
          {chartSeries.length > 0 && (
            <PanelHeaderActions>
              <PanelButton
                onClick={() => {
                  setShowTable(s => !s);
                }}
              >
                {showTable ? t('dashboard.climate.action.showChart') : t('dashboard.climate.action.showTable')}
              </PanelButton>
            </PanelHeaderActions>
          )}
        </PanelHeader>

        {chartSeries.length > 0 && showTable && (
          <StatsTable>
            <thead>
              <tr>
                <th>
                  {t('dashboard.climate.header.sensor')}
                </th>
                <th>
                  {t('dashboard.climate.header.current')}
                </th>
                <th>
                  {t('dashboard.climate.header.min')}
                </th>
                <th>
                  {t('dashboard.climate.header.avg')}
                </th>
                <th>
                  {t('dashboard.climate.header.max')}
                </th>
                <th>
                  {t('dashboard.climate.header.updated')}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparedReadings.map(r => {
                const key = getSeriesKey(r);
                const stats = getSeriesStats(historyByKey.get(key));
                return (
                  <tr key={key}>
                    <td>
                      <SensorName>
                        <LineKey color={seriesPalette[slots[key]]} />
                        {getSeriesLabel(r)}
                      </SensorName>
                    </td>
                    <td>
                      {formatValue(r.value, measurement, r.unit)}
                    </td>
                    <td>
                      {formatValue(stats.min, measurement, r.unit)}
                    </td>
                    <td>
                      {formatValue(stats.avg, measurement, r.unit)}
                    </td>
                    <td>
                      {formatValue(stats.max, measurement, r.unit)}
                    </td>
                    <td>
                      {formatRelativeTime(r.timestamp)}
                    </td>
                  </tr>
                );
              })}
              {referenceLines.map(({key, label, color, reading, series}) => {
                const stats = getSeriesStats(series);
                return (
                  <tr key={key}>
                    <td>
                      <SensorName>
                        <LineKey
                          color={color}
                          dotted
                        />
                        {label}
                      </SensorName>
                    </td>
                    <td>
                      {formatValue(reading.value, measurement, reading.unit)}
                    </td>
                    <td>
                      {formatValue(stats.min, measurement, reading.unit)}
                    </td>
                    <td>
                      {formatValue(stats.avg, measurement, reading.unit)}
                    </td>
                    <td>
                      {formatValue(stats.max, measurement, reading.unit)}
                    </td>
                    <td>
                      {formatRelativeTime(reading.timestamp)}
                    </td>
                  </tr>
                );
              })}
              {hasAverage && (
                <tr>
                  <td>
                    <SensorName>
                      <LineKey
                        color={averageLine.color}
                        dashed
                      />
                      {averageLabel}
                    </SensorName>
                  </td>
                  <td>
                    {formatValue(currentAverage, measurement, unit)}
                  </td>
                  <td>
                    {formatValue(averageStats.min, measurement, unit)}
                  </td>
                  <td>
                    {formatValue(averageStats.avg, measurement, unit)}
                  </td>
                  <td>
                    {formatValue(averageStats.max, measurement, unit)}
                  </td>
                  <td>
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </StatsTable>
        )}

        {!showTable && (hasChartPoints
          ? (
            <MeasurementChart
              measurement={measurement}
              unit={unit}
              xs={grid.xs}
              series={chartSeries}
              ariaLabel={t('dashboard.climate.compare.chartLabel', {group: groupName, sensors: chartSeries.map(s => s.label).join(', ')})}
            />
          )
          : (
            <EmptyState>
              {history ? t('dashboard.climate.compare.noData') : t('dashboard.climate.compare.loading')}
            </EmptyState>
          ))}

        {chartSeries.length > 0 && (
          <Legend aria-label={t('dashboard.climate.compare.legend')}>
            {comparedReadings.map(r => {
              const key = getSeriesKey(r);
              const removeLabel = t('dashboard.climate.action.remove', {sensor: getSeriesLabel(r)});
              return (
                <LegendItem key={key}>
                  <LineKey color={seriesPalette[slots[key]]} />
                  {getSeriesLabel(r)}
                  <LegendRemove
                    aria-label={removeLabel}
                    title={removeLabel}
                    onClick={() => {
                      toggleCompared(key);
                    }}
                  >
                    ×
                  </LegendRemove>
                </LegendItem>
              );
            })}
            {hasAverage && (
              <LegendItem>
                <LineKey
                  color={averageLine.color}
                  dashed
                />
                {averageLabel}
              </LegendItem>
            )}
            {comparedReadings.length === 0 && (
              <LegendItem>
                <MutedText>
                  {t('dashboard.climate.compare.empty', {max: maxComparedSeries})}
                </MutedText>
              </LegendItem>
            )}
          </Legend>
        )}
      </ChartPanel>

      <DashboardCardGrid>
        {readings.map(r => {
          const key = getSeriesKey(r);
          const slot = slots[key];
          const isCompared = key in slots;
          const isFull = !isCompared && comparedReadings.length >= maxComparedSeries;
          const series = historyByKey.get(key);
          const stats = getSeriesStats(series);
          const status = getStatus(r.healthState);
          const outlier = outlierKeys.high.has(key) ? 'high' : outlierKeys.low.has(key) ? 'low' : null;
          return (
            <DashboardCard key={key}>
              {outlier && (
                <DashboardCardBadge
                  rgb={outlier === 'high' ? global.palette.control.rgb.rule : global.palette.control.rgb.scene}
                  title={t(`dashboard.climate.outlier.${outlier}Detail`)}
                >
                  {outlier === 'high' ? `▲ ${t('dashboard.climate.outlier.high')}` : `▼ ${t('dashboard.climate.outlier.low')}`}
                </DashboardCardBadge>
              )}
              <DashboardCardTitle title={getSeriesLabel(r)}>
                {getSeriesLabel(r)}
              </DashboardCardTitle>
              <TileValueRow>
                <TileValue>
                  {formatValue(r.value, measurement, r.unit)}
                </TileValue>
                <StatusBadge>
                  <StatusIcon
                    color={status.color}
                    aria-hidden="true"
                  >
                    {status.icon}
                  </StatusIcon>
                  {t(status.labelKey)}
                </StatusBadge>
              </TileValueRow>
              {history && (
                <Sparkline
                  xs={grid.xs}
                  values={grid.columns.get(key) ?? []}
                  since={sparklineSince}
                  until={history.until}
                  color={isCompared ? seriesPalette[slot] : chartInk.muted}
                />
              )}
              <DashboardCardBody>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('dashboard.climate.header.room')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {getRoomDisplayName(roomNames.get(r.roomId))}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('dashboard.climate.header.range', {range: t(`dashboard.climate.range.${range.id}`)})}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {stats.min === null ? '—' : `${formatValue(stats.min, measurement)} – ${formatValue(stats.max, measurement, r.unit)}`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('dashboard.climate.header.updated')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue {...(r.timestamp ? {title: r.timestamp} : {})}>
                    {formatRelativeTime(r.timestamp)}
                  </DashboardCardFieldValue>
                </DashboardCardField>
              </DashboardCardBody>
              <DashboardCardActions>
                <DashboardChipToggle
                  selected={isCompared}
                  aria-pressed={isCompared}
                  disabled={isFull}
                  {...(isFull ? {title: t('dashboard.climate.compare.full', {max: maxComparedSeries})} : {})}
                  rgb={isCompared ? seriesPalette[slot].slice(1) : global.palette.control.rgb.climate}
                  onClick={() => {
                    toggleCompared(key);
                  }}
                >
                  {isCompared ? `✓ ${t('dashboard.climate.action.compare')}` : t('dashboard.climate.action.compare')}
                </DashboardChipToggle>
              </DashboardCardActions>
            </DashboardCard>
          );
        })}
      </DashboardCardGrid>
    </Section>
  );
};

export default MeasurementGroupSection;
