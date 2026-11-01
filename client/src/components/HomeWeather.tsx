import React, {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import global from '../constants/global';
import {chartInk, formatRelativeTime, formatTooltipTime, seriesPalette} from '../factories/measurementFactory';
import {
  DashboardActionButton,
  DashboardCard,
  DashboardCardActions,
  DashboardCardBody,
  DashboardCardField,
  DashboardCardFieldLabel,
  DashboardCardFieldValue,
  DashboardCardTitle,
  GlassPanel
} from '../factories/styleFactory';
import {formatClock, formatDegrees, getAirQualityCategory, getConditionIcon, isNight} from '../factories/weatherFactory';
import {useWeatherStore} from '../store/WeatherContextStore';
import type {IMeasurementHistoryPoint, IResponseWeather, IWeatherConditions, Nullable} from '../types/sharedContracts';
import MeasurementChart, {LineKey, type IChartSeries} from './MeasurementChart';

const historyHours = 24;
const lineColor = seriesPalette[0];
const forecastDashPx = 6;
const forecastGapPx = 4;
const forecastDash = [forecastDashPx, forecastGapPx] as const;

const Layout = styled.section`
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: ${global.measurements.dashboardGridGap};
  align-items: start;

  @media (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ConditionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ConditionIcon = styled.span`
  font-size: 3rem;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
`;

const ConditionText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Temperature = styled.span`
  font-size: 2.25rem;
  font-weight: 600;
  line-height: 1.1;
`;

const Phrase = styled.span`
  font-size: 0.9rem;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardNote = styled.div`
  font-size: 0.85rem;
  opacity: 0.7;
`;

// same light chart surface as the Climate page's chart panels (MeasurementGroupSection.tsx)
const ChartPanel = styled(GlassPanel)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  min-width: 0;
  background: ${chartInk.surface};
  color: ${chartInk.primary};
`;

const ChartHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
`;

const ChartTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const MutedText = styled.span`
  font-size: 0.8rem;
  color: ${chartInk.secondary};
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

const formatWind = (current: IWeatherConditions, speedUnit: string): string => (current.windSpeed === null
  ? '—'
  : `${current.windSpeed} ${speedUnit}${current.windDirection ? ` ${current.windDirection}` : ''}`);

const formatAmount = (value: Nullable<number>, unit: string): string => (value === null ? '—' : `${value} ${unit}`);

interface IChartData {
  xs: number[];
  series: IChartSeries[];
}

// recorded and forecast temperature on one time axis. the forecast line starts at the latest reading so the two join
const buildChartData = (weather: IResponseWeather, labels: {recorded: string; forecast: string}): IChartData => {
  const recorded: IMeasurementHistoryPoint[] = [...weather.history];
  const current = weather.current;
  // the latest reading may not be recorded yet (recording disabled, or the server polled before the vendor updated)
  if (current && current.temperature !== null && (recorded.at(-1)?.epoch ?? 0) < current.updatedAt) {
    recorded.push({epoch: current.updatedAt, value: current.temperature});
  }
  const latest = recorded.at(-1);
  const forecast = [...(latest ? [latest] : []), ...weather.forecast.filter(p => !latest || p.epoch > latest.epoch)];

  const xs = [...new Set([...recorded, ...forecast].map(p => p.epoch))].sort((a, b) => a - b);
  const alignTo = (points: IMeasurementHistoryPoint[]): Nullable<number>[] => {
    const byEpoch = new Map(points.map(p => [p.epoch, p.value]));
    return xs.map(x => byEpoch.get(x) ?? null);
  };
  // readings come every 10-20 minutes - join them across the empty x's the other line adds, but not across a real
  // gap (eg. the server was down), which stays visible as a break
  const holdBetween = (values: Nullable<number>[]): Nullable<number>[] => {
    const first = values.findIndex(v => v !== null);
    const last = values.findLastIndex(v => v !== null);
    return values.map((v, i) => (v === null && i > first && i < last ? values.slice(0, i).findLast(p => p !== null) ?? null : v));
  };

  return {
    xs: xs,
    series: [
      {key: 'recorded', label: labels.recorded, color: lineColor, values: holdBetween(alignTo(recorded)), tooltipSkipsEmpty: true},
      {key: 'forecast', label: labels.forecast, color: lineColor, dash: forecastDash, values: alignTo(forecast), tooltipSkipsEmpty: true}
    ]
  };
};

/** current outdoor conditions card plus a chart of the recorded outdoor temperature and the next hours' forecast */
const HomeWeather: React.FC = () => {
  const {t} = useTranslation();
  const {weatherData, isLoading} = useWeatherStore(historyHours);
  const current = weatherData?.current ?? null;
  const unit = weatherData?.temperatureUnit;

  const recordedLabel = t('home.weather.chart.recorded');
  const forecastLabel = t('home.weather.chart.forecast');
  const chart = useMemo(
    () => (weatherData ? buildChartData(weatherData, {recorded: recordedLabel, forecast: forecastLabel}) : null),
    [weatherData, recordedLabel, forecastLabel]
  );
  const hasChartPoints = !!chart && chart.series.some(s => s.values.some(v => v !== null));
  // recording only covers part of the window until it's been running for a full day
  const recordingStartedInWindow = !!weatherData && (weatherData.recordingSince === null || weatherData.recordingSince > weatherData.since);

  if (!weatherData) {
    return (
      <Layout aria-label={t('home.weather.sectionName')}>
        <DashboardCard>
          <DashboardCardTitle>
            {t('home.weather.sectionName')}
          </DashboardCardTitle>
          <CardNote>
            {isLoading ? t('home.weather.loading') : t('home.weather.unavailable')}
          </CardNote>
        </DashboardCard>
      </Layout>
    );
  }

  const night = current ? isNight(current.sunrise, current.sunset) : false;
  const aqi = current?.airQualityIndex ?? null;

  return (
    <Layout aria-label={t('home.weather.sectionName')}>
      <DashboardCard>
        <DashboardCardTitle>
          {t('home.weather.sectionName')}
        </DashboardCardTitle>
        {current
          ? (
            <>
              <ConditionsRow>
                <ConditionIcon
                  role="img"
                  aria-label={current.phrase ?? t('home.weather.unknownCondition')}
                >
                  {getConditionIcon(current.phrase, night)}
                </ConditionIcon>
                <ConditionText>
                  <Temperature>
                    {formatDegrees(current.temperature, unit)}
                  </Temperature>
                  <Phrase {...(current.phrase ? {title: current.phrase} : {})}>
                    {current.phrase ?? t('home.weather.unknownCondition')}
                  </Phrase>
                </ConditionText>
              </ConditionsRow>
              <DashboardCardBody>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.feelsLike')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {formatDegrees(current.feelsLike, unit)}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.highLow')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {`${formatDegrees(current.high)} / ${formatDegrees(current.low, unit)}`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.humidity')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {current.humidity === null ? '—' : `${current.humidity}%`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.wind')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {formatWind(current, weatherData.speedUnit)}
                    {current.windGust !== null && current.windGust > (current.windSpeed ?? 0) && ` (${t('home.weather.field.gusts', {speed: current.windGust})})`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.precipitation')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {formatAmount(weatherData.precipNext24h, weatherData.precipUnit)}
                    {weatherData.snowNext24h !== null && weatherData.snowNext24h > 0 && ` (${t('home.weather.field.snow', {amount: formatAmount(weatherData.snowNext24h, weatherData.precipUnit)})})`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.uv')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {current.uvIndex === null ? '—' : `${current.uvIndex}${current.uvDescription ? ` · ${current.uvDescription}` : ''}`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.airQuality')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {aqi === null ? '—' : `${aqi} · ${t(`home.weather.airQuality.${getAirQualityCategory(aqi)}`)}`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.sun')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue>
                    {`☀ ${formatClock(current.sunrise)} · ☾ ${formatClock(current.sunset)}`}
                  </DashboardCardFieldValue>
                </DashboardCardField>
                <DashboardCardField>
                  <DashboardCardFieldLabel>
                    {t('home.weather.field.updated')}
                  </DashboardCardFieldLabel>
                  <DashboardCardFieldValue title={new Date(current.updatedAt).toISOString()}>
                    {formatRelativeTime(current.updatedAt)}
                  </DashboardCardFieldValue>
                </DashboardCardField>
              </DashboardCardBody>
              <DashboardCardActions>
                <DashboardActionButton
                  as="a"
                  href={global.weather.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  rgb={global.palette.control.rgb.climate}
                >
                  {t('home.weather.action.details')}
                </DashboardActionButton>
              </DashboardCardActions>
            </>
          )
          : (
            <CardNote>
              {t('home.weather.unavailable')}
            </CardNote>
          )}
      </DashboardCard>

      <ChartPanel>
        <ChartHeader>
          <ChartTitle>
            {t('home.weather.chart.title')}
          </ChartTitle>
          <MutedText>
            {recordingStartedInWindow && weatherData.recordingSince !== null
              ? t('home.weather.chart.recordingSince', {time: formatTooltipTime(weatherData.recordingSince)})
              : t('home.weather.chart.window', {hours: historyHours})}
          </MutedText>
        </ChartHeader>
        {hasChartPoints
          ? (
            <MeasurementChart
              measurement="temperature"
              unit={weatherData.temperatureUnit}
              xs={chart.xs}
              series={chart.series}
              ariaLabel={t('home.weather.chart.label')}
            />
          )
          : (
            <EmptyState>
              {t('home.weather.chart.noData')}
            </EmptyState>
          )}
        <Legend aria-label={t('home.weather.chart.legend')}>
          <LegendItem>
            <LineKey color={lineColor} />
            {recordedLabel}
          </LegendItem>
          <LegendItem>
            <LineKey
              color={lineColor}
              dashed
            />
            {forecastLabel}
          </LegendItem>
        </Legend>
      </ChartPanel>
    </Layout>
  );
};

export default HomeWeather;
