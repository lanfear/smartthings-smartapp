import React, {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {compareFloors, getApplianceIcon, getApplianceName, getFloorName, isApplianceSensor, isApplianceTooWarm, isFan, thermostatFloor} from '../factories/houseFactory';
import {
  buildDisplayGrid,
  formatRelativeTime,
  formatValue,
  getSeriesKey,
  getSeriesLabel,
  historyRanges,
  measurementGroups,
  statusColor
} from '../factories/measurementFactory';
import {
  DashboardActionButton,
  DashboardCard,
  DashboardCardActions,
  DashboardCardBody,
  DashboardCardFieldLabel,
  DashboardCardGrid,
  DashboardCardTitle
} from '../factories/styleFactory';
import {useEventSource, useEventSourceListener} from '../providers/EventSourceProvider';
import {setDeviceDataForLocation, useDeviceData} from '../store/DeviceContextStore';
import {useMeasurementHistoryStore, useMeasurementStore} from '../store/MeasurementContextStore';
import type {IMeasurementReading, ISseEvent, Nullable} from '../types/sharedContracts';
import Sparkline from './Sparkline';

// the Climate page's 24h range - same request (and so the same cached response) as that page's default view
const applianceHistoryRange = historyRanges.find(r => r.id === '24h') ?? historyRanges[0];
const isRoomSensor = measurementGroups.find(g => g.id === 'rooms')?.includes ?? (() => true);
const okColor = `#${global.palette.control.rgb.scene}`;
const warmColor = `#${global.palette.control.rgb.rule}`;

// the shared card grid scrolls itself (the dashboard tabs fill the page with it) - here it sits in the Home page's
// scrolling column, so it keeps its full height and lets that column do the scrolling
const TileGrid = styled(DashboardCardGrid)`
  flex: none;
  overflow: visible;
`;

const Headline = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.span`
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled(DashboardCardFieldLabel)`
  font-size: 0.65rem;
`;

// one line per floor/appliance: name on the left, columns of values on the right
const Row = styled.div<{columns: string}>`
  display: grid;
  grid-template-columns: ${props => props.columns};
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
`;

const RowName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowValue = styled.span`
  text-align: right;
  white-space: nowrap;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const InlineIcon = styled.span`
  display: inline-block;
  margin-right: 0.3em;
  font-size: 0.85em;
  text-transform: none;
  letter-spacing: 0;
`;

// small emoji ahead of a label, sized to its text - decorative only, the label carries the meaning
const LabelIcon: React.FC<{icon: string}> = ({icon}) => (
  <InlineIcon aria-hidden="true">
    {icon}
  </InlineIcon>
);

const Note = styled.div`
  font-size: 0.85rem;
  opacity: 0.7;
`;

const StatusIcon = styled.span<{color: string}>`
  color: ${props => props.color};
`;

const average = (values: number[]): Nullable<number> => (values.length ? values.reduce((a, v) => a + v, 0) / values.length : null);

const isReporting = (r: IMeasurementReading): r is IMeasurementReading & {value: number} => r.value !== null && r.healthState !== 'OFFLINE';

const TileLink: React.FC<{to: string; label: string}> = ({to, label}) => (
  <DashboardCardActions>
    <DashboardActionButton
      as={Link}
      to={to}
      rgb={global.palette.control.rgb.climate}
    >
      {label}
    </DashboardActionButton>
  </DashboardCardActions>
);

interface ISwitchFloor {
  floor: string;
  lightsOn: number;
  lights: number;
  fansOn: number;
  fans: number;
}

/** how many lights (any non-fan switch) and fans are on, overall and per floor */
const SwitchesTile: React.FC = () => {
  const {t} = useTranslation();
  const deviceData = useDeviceData();

  // room tiles keep switch state live while they're on screen - the Home page has none, so it listens itself
  const eventSource = useEventSource({
    source: `${process.env.SMARTAPP_BUILDTIME_APIHOST}/events`,
    enabled: !!deviceData.locationId
  });
  useEventSourceListener<ISseEvent>({
    source: eventSource,
    event: {
      name: 'switch',
      listener: ({data}) => {
        if (deviceData.switches.some(s => s.deviceId === data.deviceId && s.value !== data.value)) {
          void setDeviceDataForLocation(deviceData.locationId, {
            ...deviceData,
            switches: deviceData.switches.map(s => (s.deviceId === data.deviceId ? {...s, value: data.value} : s))
          });
        }
      }
    }
  });

  const floors = useMemo(() => {
    // the room list already leaves out the DO NOT USE room - its switches (and any without a room) don't count
    const floorByRoom = new Map(deviceData.rooms.map(r => [r.roomId, getFloorName(r.name)]));
    const byFloor = new Map<string, ISwitchFloor>();
    deviceData.switches.forEach(s => {
      const floor = floorByRoom.get(s.roomId ?? '');
      if (!floor) {
        return;
      }
      const row = byFloor.get(floor) ?? {floor: floor, lightsOn: 0, lights: 0, fansOn: 0, fans: 0};
      const on = s.value === 'on';
      if (isFan(s.label ?? '')) {
        row.fans++;
        row.fansOn += on ? 1 : 0;
      } else {
        row.lights++;
        row.lightsOn += on ? 1 : 0;
      }
      byFloor.set(floor, row);
    });
    return [...byFloor.values()].sort((a, b) => compareFloors(a.floor, b.floor));
  }, [deviceData.rooms, deviceData.switches]);

  const sum = (pick: (f: ISwitchFloor) => number): number => floors.reduce((a, f) => a + pick(f), 0);
  const fans = sum(f => f.fans);

  return (
    <DashboardCard>
      <DashboardCardTitle>
        {t('home.house.switches.title')}
      </DashboardCardTitle>
      {floors.length
        ? (
          <>
            <Headline>
              <Stat>
                <StatValue>
                  {`💡 ${sum(f => f.lightsOn)}`}
                </StatValue>
                <StatLabel>
                  {t('home.house.switches.lightsOn', {total: sum(f => f.lights)})}
                </StatLabel>
              </Stat>
              {fans > 0 && (
                <Stat>
                  <StatValue>
                    {`🌀 ${sum(f => f.fansOn)}`}
                  </StatValue>
                  <StatLabel>
                    {t('home.house.switches.fansOn', {total: fans})}
                  </StatLabel>
                </Stat>
              )}
            </Headline>
            <DashboardCardBody>
              <Row columns="minmax(0, 1fr) 4.5rem 4.5rem">
                <DashboardCardFieldLabel>
                  {t('home.house.header.floor')}
                </DashboardCardFieldLabel>
                <RowValue>
                  <DashboardCardFieldLabel>
                    <LabelIcon icon="💡" />
                    {t('home.house.switches.lights')}
                  </DashboardCardFieldLabel>
                </RowValue>
                <RowValue>
                  <DashboardCardFieldLabel>
                    <LabelIcon icon="🌀" />
                    {t('home.house.switches.fans')}
                  </DashboardCardFieldLabel>
                </RowValue>
              </Row>
              {floors.map(f => (
                <Row
                  key={f.floor}
                  columns="minmax(0, 1fr) 4.5rem 4.5rem"
                >
                  <RowName>
                    {f.floor}
                  </RowName>
                  <RowValue>
                    {f.lights ? f.lightsOn : '—'}
                    <Muted>
                      {f.lights ? ` / ${f.lights}` : ''}
                    </Muted>
                  </RowValue>
                  <RowValue>
                    {f.fans ? f.fansOn : '—'}
                    <Muted>
                      {f.fans ? ` / ${f.fans}` : ''}
                    </Muted>
                  </RowValue>
                </Row>
              ))}
            </DashboardCardBody>
          </>
        )
        : (
          <Note>
            {t('home.house.loading')}
          </Note>
        )}
      <TileLink
        to={`/${global.routing.dashboardSegment}/${deviceData.locationId}/rooms`}
        label={t('home.house.switches.link')}
      />
    </DashboardCard>
  );
};

interface ITemperatureFloor {
  floor: string;
  avg: number;
  min: number;
  max: number;
  count: number;
  unit: Nullable<string>;
}

/** average room temperature per floor (every reporting room sensor - the same set as the Climate page's Rooms chart, plus the thermostat), and the thermostat's own line */
const IndoorTile: React.FC = () => {
  const {t} = useTranslation();
  const deviceData = useDeviceData();
  const temperature = useMeasurementStore('temperature').measurementData.readings;
  const humidity = useMeasurementStore('humidity').measurementData.readings;
  const heatingSetpoint = useMeasurementStore('heatingSetpoint').measurementData.readings;
  const coolingSetpoint = useMeasurementStore('coolingSetpoint').measurementData.readings;

  // the thermostat is the device reporting setpoints - it gets its own line (with the setpoints) and also counts toward
  // thermostatFloor, since its SmartThings room ('General') has no floor
  const thermostats = useMemo(() => temperature.filter(r => heatingSetpoint.some(h => h.deviceId === r.deviceId)), [temperature, heatingSetpoint]);

  const floors = useMemo((): ITemperatureFloor[] => {
    const floorByRoom = new Map(deviceData.rooms.map(r => [r.roomId, getFloorName(r.name)]));
    const byFloor = new Map<string, (IMeasurementReading & {value: number})[]>();
    temperature.filter(isReporting).forEach(r => {
      const floor = thermostats.includes(r) ? thermostatFloor : floorByRoom.get(r.roomId ?? '');
      if (floor && isRoomSensor(getSeriesLabel(r))) {
        byFloor.set(floor, [...byFloor.get(floor) ?? [], r]);
      }
    });
    return [...byFloor].map(([floor, readings]) => {
      const values = readings.map(r => r.value);
      return {floor: floor, avg: average(values) ?? 0, min: Math.min(...values), max: Math.max(...values), count: values.length, unit: readings[0].unit};
    }).sort((a, b) => compareFloors(a.floor, b.floor));
  }, [deviceData.rooms, temperature, thermostats]);

  const indoorHumidity = average(humidity.filter(isReporting).map(r => r.value));

  return (
    <DashboardCard>
      <DashboardCardTitle>
        {t('home.house.indoor.title')}
      </DashboardCardTitle>
      {floors.length || thermostats.length
        ? (
          <DashboardCardBody>
            <Row columns="minmax(0, 1fr) auto 4.5rem">
              <DashboardCardFieldLabel>
                {t('home.house.header.floor')}
              </DashboardCardFieldLabel>
              <RowValue>
                <DashboardCardFieldLabel>
                  {t('home.house.indoor.range')}
                </DashboardCardFieldLabel>
              </RowValue>
              <RowValue>
                <DashboardCardFieldLabel>
                  {t('home.house.indoor.average')}
                </DashboardCardFieldLabel>
              </RowValue>
            </Row>
            {floors.map(f => (
              <Row
                key={f.floor}
                columns="minmax(0, 1fr) auto 4.5rem"
                title={t('home.house.indoor.sensors', {count: f.count})}
              >
                <RowName>
                  {f.floor}
                </RowName>
                <RowValue>
                  <Muted>
                    {f.count > 1 ? `${formatValue(f.min, 'temperature')} – ${formatValue(f.max, 'temperature')}` : ''}
                  </Muted>
                </RowValue>
                <RowValue>
                  {formatValue(f.avg, 'temperature', f.unit)}
                </RowValue>
              </Row>
            ))}
            {thermostats.map(r => {
              const heat = heatingSetpoint.find(h => h.deviceId === r.deviceId)?.value ?? null;
              const cool = coolingSetpoint.find(c => c.deviceId === r.deviceId)?.value ?? null;
              return (
                <Row
                  key={getSeriesKey(r)}
                  columns="minmax(0, 1fr) auto 4.5rem"
                  title={getSeriesLabel(r)}
                >
                  <RowName>
                    <LabelIcon icon="🌡️" />
                    {t('home.house.indoor.thermostat')}
                  </RowName>
                  <RowValue>
                    <Muted>
                      {t('home.house.indoor.setpoints', {heat: formatValue(heat, 'heatingSetpoint'), cool: formatValue(cool, 'coolingSetpoint')})}
                    </Muted>
                  </RowValue>
                  <RowValue>
                    {formatValue(r.value, 'temperature', r.unit)}
                  </RowValue>
                </Row>
              );
            })}
            {indoorHumidity !== null && (
              <Row columns="minmax(0, 1fr) auto 4.5rem">
                <RowName>
                  <LabelIcon icon="💧" />
                  {t('home.house.indoor.humidity')}
                </RowName>
                <span />
                <RowValue>
                  {formatValue(indoorHumidity, 'humidity', '%')}
                </RowValue>
              </Row>
            )}
          </DashboardCardBody>
        )
        : (
          <Note>
            {t('home.house.loading')}
          </Note>
        )}
      <TileLink
        to={`/${global.routing.dashboardSegment}/${deviceData.locationId}/climate#rooms`}
        label={t('home.house.indoor.link')}
      />
    </DashboardCard>
  );
};

/** current temperature of each ZS-tagged fridge/freezer sensor with its 24h trend, flagged when too warm or offline */
const AppliancesTile: React.FC = () => {
  const {t} = useTranslation();
  const deviceData = useDeviceData();
  const temperature = useMeasurementStore('temperature').measurementData.readings;
  const {historyData} = useMeasurementHistoryStore('temperature', {hours: applianceHistoryRange.hours, bucketMinutes: applianceHistoryRange.bucketMinutes});

  const appliances = useMemo(() => temperature
    .filter(r => isApplianceSensor(r.label))
    .sort((a, b) => getApplianceName(a.label).localeCompare(getApplianceName(b.label))), [temperature]);

  const grid = useMemo(() => {
    const seriesByKey = new Map((historyData?.series ?? []).map(s => [getSeriesKey(s), s]));
    return buildDisplayGrid(
      appliances.flatMap(r => {
        const series = seriesByKey.get(getSeriesKey(r));
        return series ? [{key: getSeriesKey(r), series: series}] : [];
      }),
      historyData?.since ?? 0,
      historyData?.until ?? 0
    );
  }, [appliances, historyData]);

  return (
    <DashboardCard>
      <DashboardCardTitle>
        {t('home.house.appliances.title')}
      </DashboardCardTitle>
      {appliances.length
        ? (
          <DashboardCardBody>
            {appliances.map(r => {
              const key = getSeriesKey(r);
              const offline = r.healthState === 'OFFLINE';
              const warm = !offline && isApplianceTooWarm(r.label, r.value, r.unit);
              return (
                <Row
                  key={key}
                  columns="minmax(0, 1fr) 5rem 4.5rem 1rem"
                  title={`${getSeriesLabel(r)} · ${t('home.house.appliances.updated', {time: formatRelativeTime(r.timestamp)})}`}
                >
                  <RowName>
                    <LabelIcon icon={getApplianceIcon(r.label)} />
                    {getApplianceName(r.label)}
                  </RowName>
                  {historyData
                    ? (
                      <Sparkline
                        xs={grid.xs}
                        values={grid.columns.get(key) ?? []}
                        since={historyData.since}
                        until={historyData.until}
                        color={warm ? warmColor : okColor}
                        height={20}
                      />
                    )
                    : <span />}
                  <RowValue>
                    {offline ? (
                      <Muted>
                        {t('home.house.appliances.offline')}
                      </Muted>
                    ) : formatValue(r.value, 'temperature', r.unit)}
                  </RowValue>
                  <StatusIcon
                    color={offline ? statusColor.unknown : warm ? statusColor.critical : statusColor.good}
                    role="img"
                    aria-label={t(`home.house.appliances.status.${offline ? 'offline' : warm ? 'warm' : 'ok'}`)}
                    title={t(`home.house.appliances.status.${offline ? 'offline' : warm ? 'warm' : 'ok'}`)}
                  >
                    {offline ? '?' : warm ? '▲' : '●'}
                  </StatusIcon>
                </Row>
              );
            })}
          </DashboardCardBody>
        )
        : (
          <Note>
            {t('home.house.loading')}
          </Note>
        )}
      <TileLink
        to={`/${global.routing.dashboardSegment}/${deviceData.locationId}/climate#fridges`}
        label={t('home.house.appliances.link')}
      />
    </DashboardCard>
  );
};

/** house summary tiles for the Home page */
const HomeHouse: React.FC = () => {
  const {t} = useTranslation();
  return (
    <TileGrid aria-label={t('home.house.sectionName')}>
      <SwitchesTile />
      <IndoorTile />
      <AppliancesTile />
    </TileGrid>
  );
};

export default HomeHouse;
