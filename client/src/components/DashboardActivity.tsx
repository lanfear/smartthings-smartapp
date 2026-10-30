import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import {
  activityColor,
  activityRanges,
  bridgeGaps,
  buildActivityRooms,
  defaultIdleMinutes,
  formatDuration,
  getGridTimes,
  idleMinuteOptions,
  msPerHour,
  totalDuration,
  type IActivityRange,
  type IActivityRoom
} from '../factories/activityFactory';
import {chartInk} from '../factories/measurementFactory';
import {readStorage, writeStorage} from '../factories/storageFactory';
import {DashboardChipToggle, DashboardTitle, GlassPanel} from '../factories/styleFactory';
import {useActivityStore} from '../store/ActivityContextStore';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import type {IActivityPeriod, IResponseActivity, Nullable} from '../types/sharedContracts';
import LocationRequiredHint from './LocationRequiredHint';

const rangeStorageKey = 'activity-range';
const idleStorageKey = 'activity-idle-minutes';
const msPerMinute = 60 * 1000;
const hoursPerDay = 24;
const maxAxisTicks = 8;
const tooltipMaxWidthPx = 280;
const tooltipFlipPx = 300; // flip the tooltip to the left of the pointer when closer than this to the right edge
const dimmedOpacity = 0.55;
// periods closer together than this fraction of the window are drawn as one bar - well under a pixel apart
const bridgeFraction = 0.0005;
const tooltipOffsetPx = 14;
const tooltipEdgePx = 8;

const hatch = (color: string): string => `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 4px)`;

const PageScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: 1rem;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
`;

const FilterLabel = styled.span`
  margin: 0 0.25rem 0 0.75rem;
  font-size: 0.75rem;
  opacity: 0.8;
`;

const TimelinePanel = styled(GlassPanel)<{dimmed: boolean}>`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  color: ${chartInk.primary};
  background: ${chartInk.surface};
  opacity: ${props => props.dimmed ? dimmedOpacity : 1};
  transition: opacity 0.2s ease;
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1rem;
  font-size: 0.8rem;
  color: ${chartInk.secondary};
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const LegendKey = styled.i<{background: string}>`
  display: inline-block;
  width: 18px;
  height: 8px;
  border-radius: 2px;
  background: ${props => props.background};
`;

const MutedText = styled.span`
  font-size: 0.8rem;
  color: ${chartInk.muted};
`;

const TimelineGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(110px, 160px) minmax(0, 1fr) minmax(120px, 170px);
  column-gap: 0.75rem;
  row-gap: 2px;
  align-items: start;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ColumnHeader = styled.div`
  padding-bottom: 0.35rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${chartInk.muted};

  @media (max-width: 640px) {
    display: none;
  }
`;

const Axis = styled.div`
  position: relative;
  height: 18px;
`;

const AxisTick = styled.span`
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.7rem;
  white-space: nowrap;
  color: ${chartInk.muted};
`;

const FloorHeader = styled.div`
  grid-column: 1 / -1;
  margin-top: 0.85rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid ${activityColor.grid};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${chartInk.secondary};
`;

const RoomName = styled.div`
  padding-top: 0.6rem;
  overflow: hidden;
  font-size: 0.85rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Lanes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 0.6rem;
`;

const LaneTrack = styled.div<{height: number}>`
  position: relative;
  height: ${props => props.height}px;
  overflow: hidden;
  border-radius: 3px;
  background: ${activityColor.lane};
`;

const Stats = styled.div`
  padding-top: 0.6rem;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: ${chartInk.secondary};

  b {
    font-weight: 600;
    color: ${chartInk.primary};
  }

  @media (max-width: 640px) {
    padding-top: 0.1rem;
  }
`;

const IdleText = styled.span`
  color: ${activityColor.idle};
`;

const EmptyState = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: ${chartInk.secondary};
`;

const Tooltip = styled.div`
  position: fixed;
  z-index: ${global.zIndex.header + 1};
  max-width: 280px;
  padding: 0.35rem 0.55rem;
  pointer-events: none;
  font-size: 0.75rem;
  color: ${chartInk.primary};
  background: ${chartInk.surface};
  border: 1px solid rgba(11, 11, 11, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
`;

const TooltipTime = styled.div`
  color: ${chartInk.secondary};
`;

interface IHover {
  x: number;
  y: number;
  label: string;
  period: IActivityPeriod;
}

interface ITimelineScale {
  since: number;
  until: number;
  toPercent: (epoch: number) => number;
}

const createScale = (since: number, until: number): ITimelineScale => ({
  since: since,
  until: until,
  toPercent: epoch => ((Math.max(since, Math.min(until, epoch)) - since) / Math.max(1, until - since)) * 100
});

interface ILaneBar {
  periods: IActivityPeriod[];
  background: string;
  label: string;
}

interface ILaneProps {
  height: number;
  scale: ITimelineScale;
  gridTimes: number[];
  unrecordedUntil: Nullable<number>; // the window start up to here has no data (recording started later)
  bars: ILaneBar[];
  ariaLabel: string;
  onHover: (hover: Nullable<IHover>) => void;
}

const LaneTimeline: React.FC<ILaneProps> = ({height, scale, gridTimes, unrecordedUntil, bars, ariaLabel, onHover}) => {
  const bridgeMs = (scale.until - scale.since) * bridgeFraction;
  const place = ([start, end]: IActivityPeriod): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${scale.toPercent(start)}%`,
    width: `${Math.max(0, scale.toPercent(end) - scale.toPercent(start))}%`,
    minWidth: 2
  });
  return (
    <LaneTrack
      height={height}
      role="img"
      aria-label={ariaLabel}
    >
      {unrecordedUntil !== null && (
        <div style={{...place([scale.since, unrecordedUntil]), minWidth: 0, background: hatch(activityColor.unrecorded), opacity: 0.5}} />
      )}
      {gridTimes.map(t => (
        <div
          key={t}
          style={{position: 'absolute', top: 0, bottom: 0, left: `${scale.toPercent(t)}%`, width: 1, background: activityColor.grid}}
        />
      ))}
      {bars.map(bar => bridgeGaps(bar.periods, bridgeMs).map(period => (
        <div
          key={`${bar.label}-${period[0]}`}
          style={{...place(period), background: bar.background, borderRadius: 2}}
          onMouseMove={e => {
            onHover({x: e.clientX, y: e.clientY, label: bar.label, period: period});
          }}
          onMouseLeave={() => {
            onHover(null);
          }}
        />
      )))}
    </LaneTrack>
  );
};

// memoized so hovering (which re-renders the page for the tooltip) doesn't redraw every bar
const Lane = memo(LaneTimeline);

// a different range is still on screen while the new one loads - the timeline holds it, faded, rather than flashing empty
const isShowingStaleRange = (activity: IResponseActivity | undefined, isValidating: boolean, range: IActivityRange): boolean => isValidating
  && !!activity
  && Math.round((activity.until - activity.since) / msPerHour) !== range.hours;

const DashboardActivity: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [range, setRange] = useState<IActivityRange>(() => activityRanges.find(r => r.id === readStorage<string>(rangeStorageKey)) ?? activityRanges[1]);
  const [idleMinutes, setIdleMinutes] = useState<number>(() => {
    const stored = readStorage<number>(idleStorageKey);
    return stored !== null && idleMinuteOptions.includes(stored) ? stored : defaultIdleMinutes;
  });
  const [hover, setHover] = useState<Nullable<IHover>>(null);

  useEffect(() => {
    writeStorage(rangeStorageKey, range.id);
  }, [range]);
  useEffect(() => {
    writeStorage(idleStorageKey, idleMinutes);
  }, [idleMinutes]);

  const {activityData, isValidating} = useActivityStore(range.hours);
  const roomNames = useMemo(() => new Map(deviceData.rooms.map(r => [r.roomId, r.name])), [deviceData.rooms]);
  const rooms = useMemo(() => (activityData ? buildActivityRooms(activityData, roomNames, idleMinutes * msPerMinute) : []), [activityData, roomNames, idleMinutes]);

  const scale = useMemo(() => createScale(activityData?.since ?? 0, activityData?.until ?? 0), [activityData]);
  const gridTimes = useMemo(() => getGridTimes(scale.since, scale.until, range.gridHours), [scale, range.gridHours]);
  const recordingSince = activityData?.recordingSince ?? null;
  const unrecordedUntil = recordingSince !== null && recordingSince > scale.since ? recordingSince : null;

  const timeFormat = useMemo(() => new Intl.DateTimeFormat([], {hour: 'numeric', minute: '2-digit'}), []);
  const tickFormat = useMemo(() => new Intl.DateTimeFormat([], range.gridHours >= hoursPerDay ? {weekday: 'short'} : {hour: 'numeric'}), [range.gridHours]);
  const recordingFormat = useMemo(() => new Intl.DateTimeFormat([], {weekday: 'short', hour: 'numeric', minute: '2-digit'}), []);
  // label every tick unless they'd crowd
  const tickEvery = Math.max(1, Math.ceil(gridTimes.length / maxAxisTicks));

  const onHover = useCallback((next: Nullable<IHover>) => {
    setHover(next);
  }, []);

  const floorName = (level: number): string => {
    if (level < 0) {
      return t('dashboard.activity.floor.other');
    }
    return level === 0 ? t('dashboard.activity.floor.basement') : t('dashboard.activity.floor.level', {level});
  };

  if (!deviceData.locationId) {
    return <LocationRequiredHint sectionName={t('dashboard.activity.sectionName')} />;
  }

  const motionLabel = t('dashboard.activity.legend.motion');
  const lightLabel = t('dashboard.activity.legend.light');
  const idleLabel = t('dashboard.activity.tooltip.idle');

  const renderRoom = (room: IActivityRoom, index: number): React.ReactNode => {
    const idleTotal = totalDuration(room.idle);
    return (
      <React.Fragment key={room.roomId}>
        {(index === 0 || rooms[index - 1].floorLevel !== room.floorLevel) && (
          <FloorHeader>
            {floorName(room.floorLevel)}
          </FloorHeader>
        )}
        <RoomName title={t('dashboard.activity.roomDetail', {motion: room.motionCount, lights: room.lightCount})}>
          {room.shortName}
        </RoomName>
        <Lanes>
          <Lane
            height={12}
            scale={scale}
            gridTimes={gridTimes}
            unrecordedUntil={unrecordedUntil}
            bars={[{periods: room.motion, background: activityColor.motion, label: motionLabel}]}
            ariaLabel={`${room.shortName} ${motionLabel}: ${formatDuration(totalDuration(room.motion))}`}
            onHover={onHover}
          />
          {room.lightCount > 0 && (
            <Lane
              height={8}
              scale={scale}
              gridTimes={gridTimes}
              unrecordedUntil={unrecordedUntil}
              bars={[
                {periods: room.light, background: activityColor.light, label: lightLabel},
                {periods: room.idle, background: hatch(activityColor.idle), label: idleLabel}
              ]}
              ariaLabel={`${room.shortName} ${lightLabel}: ${formatDuration(totalDuration(room.light))}`}
              onHover={onHover}
            />
          )}
        </Lanes>
        <Stats>
          {t('dashboard.activity.stats.motion')}
          {' '}
          <b>
            {formatDuration(totalDuration(room.motion))}
          </b>
          <br />
          {t('dashboard.activity.stats.lights')}
          {' '}
          <b>
            {room.lightCount > 0 ? formatDuration(totalDuration(room.light)) : '—'}
          </b>
          {idleTotal > 0 && (
            <>
              {' · '}
              <IdleText>
                {t('dashboard.activity.stats.idle', {duration: formatDuration(idleTotal)})}
              </IdleText>
            </>
          )}
        </Stats>
      </React.Fragment>
    );
  };

  const renderBody = (): React.ReactNode => {
    if (!activityData) {
      return (
        <EmptyState>
          {t('dashboard.activity.empty.loading')}
        </EmptyState>
      );
    }
    if (recordingSince === null) {
      return (
        <EmptyState>
          {t('dashboard.activity.empty.notRecorded')}
        </EmptyState>
      );
    }
    if (!rooms.length) {
      return (
        <EmptyState>
          {t('dashboard.activity.empty.noRooms')}
        </EmptyState>
      );
    }
    return (
      <TimelineGrid>
        <ColumnHeader>
          {t('dashboard.activity.header.room')}
        </ColumnHeader>
        <Axis>
          {gridTimes.map((time, i) => (i % tickEvery === 0
            ? (
              <AxisTick
                key={time}
                style={{left: `${scale.toPercent(time)}%`}}
              >
                {tickFormat.format(time)}
              </AxisTick>
            )
            : null))}
        </Axis>
        <ColumnHeader>
          {t('dashboard.activity.header.totals')}
        </ColumnHeader>
        {rooms.map(renderRoom)}
      </TimelineGrid>
    );
  };

  return (
    <>
      <DashboardTitle>
        {t('dashboard.activity.sectionName')}
      </DashboardTitle>
      <PageScroll>
        <FilterRow>
          <span
            role="group"
            aria-label={t('dashboard.activity.filter.range')}
          >
            {activityRanges.map(r => (
              <DashboardChipToggle
                key={r.id}
                selected={r.id === range.id}
                aria-pressed={r.id === range.id}
                rgb={global.palette.control.rgb.motion}
                style={{marginRight: '0.35rem'}}
                onClick={() => {
                  setRange(r);
                }}
              >
                {t(`dashboard.activity.range.${r.id}`)}
              </DashboardChipToggle>
            ))}
          </span>
          <FilterLabel>
            {t('dashboard.activity.filter.idle')}
          </FilterLabel>
          <span
            role="group"
            aria-label={t('dashboard.activity.filter.idle')}
          >
            {idleMinuteOptions.map(minutes => (
              <DashboardChipToggle
                key={minutes}
                selected={minutes === idleMinutes}
                aria-pressed={minutes === idleMinutes}
                rgb={global.palette.control.rgb.motion}
                style={{marginRight: '0.35rem'}}
                onClick={() => {
                  setIdleMinutes(minutes);
                }}
              >
                {t('dashboard.activity.idleOption', {minutes})}
              </DashboardChipToggle>
            ))}
          </span>
        </FilterRow>

        <TimelinePanel dimmed={isShowingStaleRange(activityData, isValidating, range)}>
          <Legend>
            <LegendItem>
              <LegendKey background={activityColor.motion} />
              {motionLabel}
            </LegendItem>
            <LegendItem>
              <LegendKey background={activityColor.light} />
              {lightLabel}
            </LegendItem>
            <LegendItem>
              <LegendKey background={`${hatch(activityColor.idle)}, ${activityColor.light}`} />
              {t('dashboard.activity.legend.idle', {minutes: idleMinutes})}
            </LegendItem>
            {unrecordedUntil !== null && (
              <LegendItem>
                <LegendKey background={hatch(activityColor.unrecorded)} />
                <MutedText>
                  {t('dashboard.activity.legend.unrecorded', {time: recordingFormat.format(unrecordedUntil)})}
                </MutedText>
              </LegendItem>
            )}
          </Legend>
          {renderBody()}
        </TimelinePanel>
      </PageScroll>

      {hover && (
        <Tooltip
          style={{
            top: hover.y + tooltipOffsetPx,
            // flip to the left of the pointer near the right edge
            ...(hover.x > window.innerWidth - tooltipFlipPx ? {right: window.innerWidth - hover.x + tooltipOffsetPx} : {left: hover.x + tooltipOffsetPx}),
            maxWidth: Math.min(tooltipMaxWidthPx, window.innerWidth - (2 * tooltipEdgePx))
          }}
        >
          <b>
            {hover.label}
          </b>
          <TooltipTime>
            {`${timeFormat.format(hover.period[0])} – ${hover.period[1] >= scale.until ? t('dashboard.activity.tooltip.now') : timeFormat.format(hover.period[1])} · ${formatDuration(hover.period[1] - hover.period[0])}`}
          </TooltipTime>
        </Tooltip>
      )}
    </>
  );
};

export default DashboardActivity;
