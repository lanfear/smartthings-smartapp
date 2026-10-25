import React from 'react';
import styled from 'styled-components';
import type {Nullable} from '../types/interfaces';

interface ISparklineProps {
  xs: number[]; // shared time axis (epoch ms) - the group's display grid
  values: Nullable<number>[]; // held value at each x, null while offline / before the first reading
  since: number; // x range shared by every card in the group, so trends line up in time
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

// trend-only mini line for a sensor card - values are on the card itself and in the comparison chart/table.
// broken wherever the value is null (device offline / no reading yet)
const Sparkline: React.FC<ISparklineProps> = ({xs, values, since, until, color, height = defaultHeight}) => {
  const present = values.filter((v): v is number => v !== null);
  if (present.length < 2 || until <= since) {
    return (
      <SparklineSvg
        height={height}
        aria-hidden="true"
      />
    );
  }

  const min = Math.min(...present);
  const max = Math.max(...present);
  const span = max - min || 1; // flat line sits in the middle instead of dividing by zero
  const pad = span * verticalPaddingRatio;
  const toX = (epoch: number): string => (((Math.max(epoch, since) - since) / (until - since)) * viewBoxWidth).toFixed(2);
  const toY = (value: number): string => (height - (((value - min + pad) / (span + (pad * 2))) * height)).toFixed(2);

  // M starts a segment after a gap, L draws a straight line to the next point. the last held value extends to `until` (now)
  let path = '';
  let inSegment = false;
  for (let i = 0; i < xs.length; i++) {
    const v = values[i];
    if (v === null) {
      inSegment = false;
      continue;
    }
    path += ` ${inSegment ? 'L' : 'M'}${toX(xs[i])},${toY(v)}`;
    inSegment = true;
  }
  if (inSegment) {
    path += ` H${toX(until)}`;
  }

  return (
    <SparklineSvg
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={path.trim()}
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
