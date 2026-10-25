import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
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
import {useMeasurementHistoryStore, useMeasurementStore} from '../store/MeasurementContextStore';
import type {IMeasurementType, IResponseMeasurementHistory} from '../types/sharedContracts';
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
  const temperature = useMeasurementStore('temperature');
  const humidity = useMeasurementStore('humidity');
  const temperatureHistory = useMeasurementHistoryStore('temperature', historyOptions);
  const humidityHistory = useMeasurementHistoryStore('humidity', historyOptions);

  const historyByMeasurement = {temperature: temperatureHistory, humidity: humidityHistory} satisfies Record<IMeasurementType, unknown>;
  const temperatureReadings = temperature.measurementData.readings;
  const humidityReadings = humidity.measurementData.readings;
  // memoized so a section only rebuilds its chart when its own data changes
  const readingsByGroup = useMemo(() => new Map(measurementGroups.map(group => [
    group.id,
    (group.measurement === 'temperature' ? temperatureReadings : humidityReadings).filter(r => group.includes(getSeriesLabel(r)))
  ])), [temperatureReadings, humidityReadings]);

  const roomNames = useMemo(() => new Map(deviceData.rooms.map(r => [r.roomId, r.name])), [deviceData.rooms]);

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
              range={range}
              roomNames={roomNames}
              dimmed={isShowingStaleRange(data.historyData, data.isValidating, range)}
              readingsSettled={!(group.measurement === 'temperature' ? temperature : humidity).isValidating}
            />
          );
        })}
      </PageScroll>
    </>
  );
};

export default DashboardClimate;
