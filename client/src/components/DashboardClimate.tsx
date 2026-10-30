import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useLocation} from 'react-router-dom';
import styled from 'styled-components';
import global from '../constants/global';
import {
  getSeriesLabel,
  historyRanges,
  measurementGroups,
  msPerHour,
  type IHistoryRange
} from '../factories/measurementFactory';
import {readStorage, writeStorage} from '../factories/storageFactory';
import {DashboardChipToggle, DashboardTitle} from '../factories/styleFactory';
import {useDeviceData, useLocationIdParam} from '../store/DeviceContextStore';
import {useMeasurementHistoryStore, useMeasurementStore, type IMeasurementHistoryStore, type IMeasurementStore} from '../store/MeasurementContextStore';
import type {IMeasurementReading, IMeasurementType, IResponseMeasurementHistory} from '../types/sharedContracts';
import LocationRequiredHint from './LocationRequiredHint';
import MeasurementGroupSection from './MeasurementGroupSection';

const rangeStorageKey = 'climate-range';

const PageScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: 1rem;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

// a different range is still on screen while the new one loads - sections hold it, faded, rather than flashing empty
const isShowingStaleRange = (history: IResponseMeasurementHistory | undefined, isValidating: boolean, range: IHistoryRange): boolean => isValidating
  && !!history
  && Math.round((history.until - history.since) / msPerHour) !== range.hours;

const DashboardClimate: React.FC = () => {
  const {t} = useTranslation();
  useLocationIdParam();
  const deviceData = useDeviceData();
  const [range, setRange] = useState<IHistoryRange>(() => historyRanges.find(r => r.id === readStorage<string>(rangeStorageKey)) ?? historyRanges[1]);

  useEffect(() => {
    writeStorage(rangeStorageKey, range.id);
  }, [range]);

  const historyOptions = {hours: range.hours, bucketMinutes: range.bucketMinutes};
  // one explicit call per measurement (hooks can't run in a loop) - `satisfies` fails the build if a new measurement type is missing here
  const currentByMeasurement = {
    temperature: useMeasurementStore('temperature'),
    humidity: useMeasurementStore('humidity'),
    battery: useMeasurementStore('battery'),
    heatingSetpoint: useMeasurementStore('heatingSetpoint'),
    coolingSetpoint: useMeasurementStore('coolingSetpoint')
  } satisfies Record<IMeasurementType, IMeasurementStore>;
  const historyByMeasurement = {
    temperature: useMeasurementHistoryStore('temperature', historyOptions),
    humidity: useMeasurementHistoryStore('humidity', historyOptions),
    battery: useMeasurementHistoryStore('battery', historyOptions),
    heatingSetpoint: useMeasurementHistoryStore('heatingSetpoint', historyOptions),
    coolingSetpoint: useMeasurementHistoryStore('coolingSetpoint', historyOptions)
  } satisfies Record<IMeasurementType, IMeasurementHistoryStore>;

  // memoized on the stores' own (stable) data so a section only rebuilds its chart when its own data changes
  const temperatureReadings = currentByMeasurement.temperature.measurementData.readings;
  const humidityReadings = currentByMeasurement.humidity.measurementData.readings;
  const batteryReadings = currentByMeasurement.battery.measurementData.readings;
  const heatingSetpointReadings = currentByMeasurement.heatingSetpoint.measurementData.readings;
  const coolingSetpointReadings = currentByMeasurement.coolingSetpoint.measurementData.readings;
  const readingsByMeasurement = useMemo(() => ({
    temperature: temperatureReadings,
    humidity: humidityReadings,
    battery: batteryReadings,
    heatingSetpoint: heatingSetpointReadings,
    coolingSetpoint: coolingSetpointReadings
  } satisfies Record<IMeasurementType, IMeasurementReading[]>), [temperatureReadings, humidityReadings, batteryReadings, heatingSetpointReadings, coolingSetpointReadings]);

  const readingsByGroup = useMemo(() => new Map(measurementGroups.map(group => [
    group.id,
    readingsByMeasurement[group.measurement].filter(r => group.includes(getSeriesLabel(r)))
  ])), [readingsByMeasurement]);

  // reference lines (setpoints) only need their history - the groups' own measurements get theirs per section below
  const heatingSetpointHistory = historyByMeasurement.heatingSetpoint.historyData;
  const coolingSetpointHistory = historyByMeasurement.coolingSetpoint.historyData;
  const referencesByGroup = useMemo(() => {
    const referenceHistory: Partial<Record<IMeasurementType, IResponseMeasurementHistory>> = {heatingSetpoint: heatingSetpointHistory, coolingSetpoint: coolingSetpointHistory};
    return new Map(measurementGroups.map(group => [
      group.id,
      (group.references ?? []).map(ref => ({...ref, readings: readingsByMeasurement[ref.measurement], history: referenceHistory[ref.measurement] ?? null}))
    ]));
  }, [readingsByMeasurement, heatingSetpointHistory, coolingSetpointHistory]);

  const roomNames = useMemo(() => new Map(deviceData.rooms.map(r => [r.roomId, r.name])), [deviceData.rooms]);

  // jump to the section named in the URL hash (e.g. #freezers from the nav menu). the router doesn't scroll to hashes
  // itself, and the sections only exist once their data is in - so this runs when the hash is navigated to (each
  // navigation gets a new location key, so clicking the same section link again re-scrolls) and when that section
  // first renders, but not on every data refresh
  const {hash, key: navigationKey} = useLocation();
  const anchor = hash.slice(1);
  // wait for history too: charts and sparklines arriving afterwards would grow the sections above and push the target down
  const historyLoaded = Object.values(historyByMeasurement).every(h => !!h.historyData);
  const anchorSectionReady = !!deviceData.locationId && historyLoaded && measurementGroups.some(g => g.anchor === anchor && (readingsByGroup.get(g.id)?.length ?? 0) > 0);
  useEffect(() => {
    if (anchorSectionReady) {
      document.getElementById(anchor)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }, [anchor, anchorSectionReady, navigationKey]);

  if (!deviceData.locationId) {
    return <LocationRequiredHint sectionName={t('dashboard.climate.sectionName')} />;
  }

  return (
    <>
      <DashboardTitle>
        {t('dashboard.climate.sectionName')}
      </DashboardTitle>
      <PageScroll>
        <FilterRow
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
        </FilterRow>

        {measurementGroups.map(group => {
          const data = historyByMeasurement[group.measurement];
          const readings = readingsByGroup.get(group.id) ?? [];
          if (!readings.length) {
            return null;
          }
          return (
            <MeasurementGroupSection
              key={group.id}
              group={group}
              readings={readings}
              history={data.historyData ?? null}
              references={referencesByGroup.get(group.id) ?? []}
              range={range}
              roomNames={roomNames}
              dimmed={isShowingStaleRange(data.historyData, data.isValidating, range)}
              readingsSettled={!currentByMeasurement[group.measurement].isValidating}
            />
          );
        })}
      </PageScroll>
    </>
  );
};

export default DashboardClimate;
