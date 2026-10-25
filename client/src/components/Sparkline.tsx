import React from 'react';
import styled from 'styled-components';
import type {IMeasurementHistoryPoint} from '../types/sharedContracts';

interface ISparklineProps {
  points: IMeasurementHistoryPoint[];
  since: number; // x range is the whole requested window, so gaps and late starts read the same on every card
  until: number;
  color: string;
  height?: number;
}

const viewBoxWidth = 100;
const defaultHeight = 36;
const verticalPaddingRatio = 0.1;

const SparklineSvg = styled.svg`
  display: block;
  width: 100%;
  overflow: visible;
`;

// trend-only mini line for a sensor card - values are on the card itself and in the comparison chart/table
const Sparkline: React.FC<ISparklineProps> = ({points, since, until, color, height = defaultHeight}) => {
  if (points.length < 2 || until <= since) {
    return (
      <SparklineSvg
        height={height}
        aria-hidden="true"
      />
    );
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // flat line sits in the middle instead of dividing by zero
  const pad = span * verticalPaddingRatio;
  const toX = (epoch: number): number => ((epoch - since) / (until - since)) * viewBoxWidth;
  const toY = (value: number): number => height - (((value - min + pad) / (span + (pad * 2))) * height);

  return (
    <SparklineSvg
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points.map(p => `${toX(p.epoch).toFixed(2)},${toY(p.value).toFixed(2)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </SparklineSvg>
  );
};

export default Sparkline;
