import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import {
  chartInk,
  formatRelativeTime,
  formatValue,
  getSeriesKey,
  getSeriesLabel,
  getSeriesStats,
  historyRanges,
  maxComparedSeries,
  measurementTypes,
  seriesPalette,
  statusColor,
  toggleSeriesSlot,
  msPerHour,
  type IHistoryRange
} from '../factories/measurementFactory';
import {
  DashboardCard,
  DashboardCardActions,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue,
  DashboardCardGrid,
  DashboardCardTitle,
  DashboardChipToggle,
  DashboardTitle,
  GlassPanel
} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import {useMeasurementHistoryStore, useMeasurementStore} from '../store/MeasurementContextStore';
import type {IMeasurementReading, IMeasurementType} from '../types/sharedContracts';
import MeasurementChart, {LineKey, type IChartSeries} from './MeasurementChart';
import Sparkline from './Sparkline';

type SlotMap = Record<string, number>;

const defaultComparedCount = 4;
const dimmedOpacity = 0.55;
const storageKeys = {
  measurement: 'climate-measurement',
  range: 'climate-range',
  slots: (measurement: IMeasurementType): string => `climate-compare-${measurement}`
};

// per-viewer conveniences only - storage can be unavailable (private mode, blocked site data), so never let it throw
const readStorage = <T, >(key: string): T | null => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore - selection just won't be remembered
  }
};

const PageScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${global.measurements.dashboardGridGap};
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: 1rem;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.25rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
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

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${chartInk.primary};
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

const getStatus = (healthState: string | null): {icon: string; color: string; labelKey: string} => {
  if (healthState === 'ONLINE') {
    return {icon: '●', color: statusColor.good, labelKey: 'dashboard.climate.status.online'};
  }
  if (healthState === 'OFFLINE') {
    return {icon: '▲', color: statusColor.critical, labelKey: 'dashboard.climate.status.offline'};
  }
  return {icon: '?', color: statusColor.unknown, labelKey: 'dashboard.climate.status.unknown'};
};

// only measurements the viewer has actually picked sensors for - the rest fall back to getDefaultSlots
const loadStoredSlots = (): Partial<Record<IMeasurementType, SlotMap>> => {
  const stored: Partial<Record<IMeasurementType, SlotMap>> = {};
  measurementTypes.forEach(m => {
    const slots = readStorage<SlotMap>(storageKeys.slots(m));
    if (slots) {
      stored[m] = slots;
    }
  });
  return stored;
};

// first few sensors that are reporting - skip offline ones, which have no recent history to draw
const getDefaultSlots = (readings: IMeasurementReading[]): SlotMap => Object.fromEntries(readings
  .filter(r => r.value !== null && r.healthState !== 'OFFLINE')
  .slice(0, defaultComparedCount)
  .map((r, i) => [getSeriesKey(r), i]));

const DashboardClimate: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();

  const [measurement, setMeasurement] = useState<IMeasurementType>(() => readStorage<IMeasurementType>(storageKeys.measurement) ?? 'temperature');
  const [range, setRange] = useState<IHistoryRange>(() => historyRanges.find(r => r.id === readStorage<string>(storageKeys.range)) ?? historyRanges[1]);
  const [slotsByMeasurement, setSlotsByMeasurement] = useState(loadStoredSlots);
  const [showTable, setShowTable] = useState(false);

  const {measurementData} = useMeasurementStore(measurement);
  const {historyData, isValidating} = useMeasurementHistoryStore(measurement, {hours: range.hours, bucketMinutes: range.bucketMinutes});

  // the store hands back the previous measurement's readings while the new one loads - don't mix them up
  const readings = useMemo(() => (measurementData.measurement === measurement ? measurementData.readings : []), [measurementData, measurement]);
  const readingKeys = useMemo(() => readings.map(getSeriesKey), [readings]);
  const history = historyData?.measurement === measurement ? historyData : null;
  const historyByKey = useMemo(() => new Map((history?.series ?? []).map(s => [getSeriesKey(s), s])), [history]);
  // sparklines share one x range: from the oldest recorded point in the response (recording may not cover the whole
  // requested window yet) to now, so every card's trend lines up in time with the others
  const sparklineSince = useMemo(() => {
    const epochs = (history?.series ?? []).flatMap(s => s.points.slice(0, 1).map(p => p.epoch));
    return epochs.length ? Math.max(Math.min(...epochs), history?.since ?? 0) : history?.since ?? 0;
  }, [history]);
  const roomNames = useMemo(() => new Map(deviceData.rooms.map(r => [r.roomId, r.name])), [deviceData.rooms]);

  const storedSlots = slotsByMeasurement[measurement];
  const slots = useMemo(() => storedSlots ?? getDefaultSlots(readings), [storedSlots, readings]);
  const comparedReadings = useMemo(() => readings.filter(r => getSeriesKey(r) in slots), [readings, slots]);

  const updateSlots = useCallback((next: SlotMap) => {
    setSlotsByMeasurement(prev => ({...prev, [measurement]: next}));
    writeStorage(storageKeys.slots(measurement), next);
  }, [measurement]);

  useEffect(() => {
    writeStorage(storageKeys.measurement, measurement);
  }, [measurement]);

  useEffect(() => {
    writeStorage(storageKeys.range, range.id);
  }, [range]);

  const chartSeries: IChartSeries[] = useMemo(() => comparedReadings.flatMap(r => {
    const key = getSeriesKey(r);
    const series = historyByKey.get(key);
    return series ? [{key: key, label: getSeriesLabel(r), color: seriesPalette[slots[key]], series: series}] : [];
  }), [comparedReadings, historyByKey, slots]);
  const hasChartPoints = chartSeries.some(s => s.series.points.length > 0);
  const unit = comparedReadings[0]?.unit ?? readings[0]?.unit ?? null;

  // a different range is still on screen while the new one loads - hold it, faded, rather than flashing empty
  const historyRangeHours = history ? Math.round((history.until - history.since) / msPerHour) : range.hours;
  const isShowingStaleRange = isValidating && historyRangeHours !== range.hours;

  if (!deviceData.locationId) {
    return null;
  }

  const measurementName = t(`dashboard.climate.measurement.${measurement}`);

  return (
    <>
      <DashboardTitle>
        {t('dashboard.climate.sectionName')}
      </DashboardTitle>
      <PageScroll>
        <FilterRow>
          <FilterGroup
            role="group"
            aria-label={t('dashboard.climate.filter.measurement')}
          >
            {measurementTypes.map(m => (
              <DashboardChipToggle
                key={m}
                selected={m === measurement}
                aria-pressed={m === measurement}
                rgb={global.palette.control.rgb.climate}
                onClick={() => {
                  setMeasurement(m);
                }}
              >
                {t(`dashboard.climate.measurement.${m}`)}
              </DashboardChipToggle>
            ))}
          </FilterGroup>
          <FilterGroup
            role="group"
            aria-label={t('dashboard.climate.filter.range')}
          >
            {historyRanges.map(r => (
              <DashboardChipToggle
                key={r.id}
                selected={r.id === range.id}
                aria-pressed={r.id === range.id}
                rgb={global.palette.control.rgb.climate}
                onClick={() => {
                  setRange(r);
                }}
              >
                {t(`dashboard.climate.range.${r.id}`)}
              </DashboardChipToggle>
            ))}
          </FilterGroup>
        </FilterRow>

        <ChartPanel dimmed={isShowingStaleRange}>
          <PanelHeader>
            <PanelTitle>
              {t('dashboard.climate.compare.title', {measurement: measurementName})}
            </PanelTitle>
            <MutedText>
              {t('dashboard.climate.compare.selectedCount', {count: comparedReadings.length, max: maxComparedSeries})}
            </MutedText>
            {comparedReadings.length > 0 && (
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

          {comparedReadings.length === 0 && (
            <EmptyState>
              {t('dashboard.climate.compare.empty', {max: maxComparedSeries})}
            </EmptyState>
          )}

          {comparedReadings.length > 0 && showTable && (
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
              </tbody>
            </StatsTable>
          )}

          {comparedReadings.length > 0 && !showTable && (hasChartPoints
            ? (
              <MeasurementChart
                measurement={measurement}
                unit={unit}
                series={chartSeries}
                ariaLabel={t('dashboard.climate.compare.chartLabel', {measurement: measurementName, sensors: chartSeries.map(s => s.label).join(', ')})}
              />
            )
            : (
              <EmptyState>
                {history ? t('dashboard.climate.compare.noData') : t('dashboard.climate.compare.loading')}
              </EmptyState>
            ))}

          {comparedReadings.length > 0 && (
            <Legend aria-label={t('dashboard.climate.compare.legend')}>
              {comparedReadings.map(r => {
                const key = getSeriesKey(r);
                return (
                  <LegendItem key={key}>
                    <LineKey color={seriesPalette[slots[key]]} />
                    {getSeriesLabel(r)}
                    <LegendRemove
                      aria-label={t('dashboard.climate.action.remove', {sensor: getSeriesLabel(r)})}
                      title={t('dashboard.climate.action.remove', {sensor: getSeriesLabel(r)})}
                      onClick={() => {
                        updateSlots(toggleSeriesSlot(slots, key, readingKeys));
                      }}
                    >
                      ×
                    </LegendRemove>
                  </LegendItem>
                );
              })}
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
            return (
              <DashboardCard key={key}>
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
                    points={series?.points ?? []}
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
                      updateSlots(toggleSeriesSlot(slots, key, readingKeys));
                    }}
                  >
                    {isCompared ? `✓ ${t('dashboard.climate.action.compare')}` : t('dashboard.climate.action.compare')}
                  </DashboardChipToggle>
                </DashboardCardActions>
              </DashboardCard>
            );
          })}
        </DashboardCardGrid>
      </PageScroll>
    </>
  );
};

export default DashboardClimate;
