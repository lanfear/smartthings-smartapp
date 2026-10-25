import React, {useEffect, useMemo, useRef, useState} from 'react';
import styled from 'styled-components';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import {chartInk, formatTooltipTime, formatUnit, formatValue} from '../factories/measurementFactory';
import type {Nullable} from '../types/interfaces';
import type {IMeasurementType} from '../types/sharedContracts';

export interface IChartSeries {
  key: string;
  label: string;
  color: string;
  values: Nullable<number>[]; // one per x - null breaks the line (device offline, or no reading yet)
  dash?: readonly number[]; // dashed line, e.g. the group average reference line
}

interface IMeasurementChartProps {
  measurement: IMeasurementType;
  unit: Nullable<string>;
  xs: number[]; // shared time axis, epoch ms
  series: IChartSeries[];
  ariaLabel: string;
}

interface IHoverState {
  idx: number;
  left: number;
  top: number;
}

const chartHeight = 300;
const tooltipFlipMargin = 240; // flip the tooltip to the left of the crosshair when closer than this to the right edge
const chartFont = '12px system-ui, -apple-system, "Segoe UI", sans-serif';

const ChartContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: ${chartHeight}px;

  /* uPlot's crosshair defaults to dashed - keep it a solid recessive hairline (extra .uplot so this beats
     uPlot's own stylesheet, which loads after the styled-components styles) */
  .uplot .u-cursor-x {
    border-right: 1px solid ${chartInk.axis};
  }

  .u-select {
    background: rgba(42, 120, 214, 0.08);
  }
`;

const Tooltip = styled.div<{flip: boolean}>`
  position: absolute;
  z-index: 2;
  pointer-events: none;
  transform: ${props => props.flip ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)'};
  min-width: 160px;
  max-width: 280px;
  padding: 0.5rem 0.65rem;
  background: ${chartInk.surface};
  border: 1px solid rgba(11, 11, 11, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 0.75rem;
  color: ${chartInk.primary};
`;

const TooltipTime = styled.div`
  color: ${chartInk.secondary};
  margin-bottom: 0.35rem;
`;

const TooltipRow = styled.div`
  display: grid;
  grid-template-columns: 12px auto 1fr;
  align-items: center;
  gap: 0.45rem;
  line-height: 1.5;
`;

// short stroke of a series' color that keys it in legends/tooltips/tables - dashed to match a dashed line
export const LineKey = styled.span<{color: string; dashed?: boolean}>`
  display: inline-block;
  flex: none;
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: ${props => props.dashed ? `repeating-linear-gradient(90deg, ${props.color} 0 4px, transparent 4px 6px)` : props.color};
`;

const TooltipValue = styled.span`
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const TooltipLabel = styled.span`
  color: ${chartInk.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ticks land on round numbers - only show a decimal when some tick needs one, and then on every tick so they line up
const formatTicks = (splits: number[], unit: Nullable<string>): string[] => {
  const digits = splits.every(v => Number.isInteger(v)) ? 0 : 1;
  return splits.map(v => `${v.toFixed(digits)}${formatUnit(unit)}`);
};

const MeasurementChart: React.FC<IMeasurementChartProps> = ({measurement, unit, xs, series, ariaLabel}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // uPlot gets its own host element so it never shares a parent with React-managed children (the tooltip)
  const plotHostRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<Nullable<uPlot>>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<Nullable<IHoverState>>(null);

  // uPlot's time scale is in seconds
  const data = useMemo((): uPlot.AlignedData => [xs.map(x => x / 1000), ...series.map(s => s.values)], [xs, series]);
  const colors = useMemo(() => series.map(s => s.color), [series]);
  // the plot can only be built once the container has a size (it may mount hidden or before layout)
  const hasWidth = width > 0;

  // follow the container width - uPlot draws to a fixed-size canvas
  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(entries => {
      setWidth(Math.floor(entries[0].contentRect.width));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  // rebuild the plot when the data or series change - a refresh every few minutes, so recreating is simpler than patching
  useEffect(() => {
    const element = containerRef.current;
    const host = plotHostRef.current;
    if (!element || !host || !element.clientWidth) {
      return;
    }

    const options: uPlot.Options = {
      width: element.clientWidth,
      height: chartHeight,
      legend: {show: false},
      scales: {x: {time: true}},
      cursor: {
        y: false,
        points: {
          size: 8,
          width: 2,
          stroke: chartInk.surface,
          fill: (_, seriesIdx) => colors[seriesIdx - 1]
        }
      },
      axes: [
        {
          font: chartFont,
          stroke: chartInk.muted,
          grid: {stroke: chartInk.grid, width: 1},
          ticks: {stroke: chartInk.axis, width: 1, size: 4}
        },
        {
          font: chartFont,
          stroke: chartInk.muted,
          size: 64,
          grid: {stroke: chartInk.grid, width: 1},
          ticks: {stroke: chartInk.axis, width: 1, size: 4},
          values: (_, splits) => formatTicks(splits, unit)
        }
      ],
      series: [
        {},
        ...series.map(s => ({
          label: s.label,
          stroke: s.color,
          width: 2,
          ...(s.dash ? {dash: [...s.dash]} : {}),
          // values are already held forward between readings - a null is a real gap (device offline)
          spanGaps: false,
          // every x has a held value, so per-point markers would suggest readings that never happened
          points: {show: false}
        }))
      ],
      hooks: {
        setCursor: [
          u => {
            const {idx, left, top} = u.cursor;
            if (typeof idx !== 'number' || typeof left !== 'number' || left < 0 || typeof top !== 'number') {
              setHover(null);
              return;
            }
            // cursor position is relative to the plotting area - offset it into the container
            const overRect = u.over.getBoundingClientRect();
            const containerRect = element.getBoundingClientRect();
            setHover({idx: idx, left: overRect.left - containerRect.left + left, top: overRect.top - containerRect.top + top});
          }
        ]
      }
    };

    // eslint-disable-next-line new-cap -- uPlot's class name is lowercase
    const plot = new uPlot(options, data, host);
    plotRef.current = plot;
    return () => {
      plot.destroy();
      plotRef.current = null;
      setHover(null);
    };
  }, [data, colors, series, unit, hasWidth]);

  useEffect(() => {
    if (width) {
      plotRef.current?.setSize({width: width, height: chartHeight});
    }
  }, [width]);

  const hoverTime = hover ? data[0][hover.idx] : null;

  return (
    <ChartContainer
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
    >
      <div ref={plotHostRef} />
      {hover && hoverTime !== null && (
        <Tooltip
          flip={hover.left > width - tooltipFlipMargin}
          style={{left: hover.left, top: hover.top}}
        >
          <TooltipTime>
            {formatTooltipTime(hoverTime * 1000)}
          </TooltipTime>
          {series.map(s => (
            <TooltipRow key={s.key}>
              <LineKey
                color={s.color}
                dashed={!!s.dash}
              />
              <TooltipValue>
                {formatValue(s.values[hover.idx] ?? null, measurement, unit)}
              </TooltipValue>
              <TooltipLabel>
                {s.label}
              </TooltipLabel>
            </TooltipRow>
          ))}
        </Tooltip>
      )}
    </ChartContainer>
  );
};

export default MeasurementChart;
