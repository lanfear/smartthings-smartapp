import styled, {keyframes} from 'styled-components';
import global from '../constants/global';

export const FlexRowCenter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const FlexColumnCenter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const DeviceBorderAnimation = keyframes`
    50% {
        border: 1px solid rgba( 255, 255, 255, 0.18 );
    }
`;

// builds the shared "glass tile" gradient recipe (a device/rule color fading from a translucent start stop to a
// near-opaque 'dd' end stop) - pass startAlpha to make the start stop translucent (e.g. global.palette.control.alpha),
// or omit it for a fully-opaque start stop (e.g. a solid badge)
export const createControlGradient = (rgb: string, startAlpha = '', endAlpha = 'dd'): string => `linear-gradient(135deg, #${rgb}${startAlpha} 0%, #${rgb}${endAlpha} 100%)`;

export const ActionLogo = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.75;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2)) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.15));
  font-size: 2.5rem;
`;

export const ControlLogo = styled(ActionLogo)`
  z-index: 0;
  pointer-events: none;
`;

export const ControlStatus = styled.div`
    font-weight: 500;
    line-height: 1;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.25rem 0.5rem;
    min-width: 80%;
    color: darkred;
    text-transform: lowercase;
    letter-spacing: 0.5px;
    z-index: 1;
    position: relative;
`;

export const ActionStatus = styled(ControlStatus)`
  display: none;
  justify-content: center;
  align-items: center;
  height: 100%;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease-in-out;
`;

export const ControlIcon = styled.div<{fontSize?: string}>`
  top: -.75rem;
  left: -.75rem;
  font-size: ${props => props.fontSize ?? '1.5rem'};
  display: flex;
  width: 100%;
  justify-content: space-between;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  z-index: 2;
  position: absolute;
`;

export const ControlContainer = styled.button.attrs<{isLinkedActive?: boolean; isLockedActive?: boolean}>(p => ({
  className: `${p.isLinkedActive ? 'linkedActive' : ''} ${p.isLockedActive ? 'lockedActive' : ''}`
}))<{isLinkedActive?: boolean; isLockedActive?: boolean; rgb: string}>`
  height: ${global.measurements.deviceWidth};
  width: ${global.measurements.deviceWidth};
  display: flex;
  flex: none;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: space-between;
  background: ${props => createControlGradient(props.rgb, global.palette.control.alpha)};
  box-shadow: ${global.shadows.tile};
  backdrop-filter: ${global.blur.lg};
  border-radius: ${global.borderRadius.md};
  border: 1px solid rgba(255, 255, 255, 0.12);
  margin: ${global.measurements.deviceMargin};
  transition: ${global.transitions.smooth};
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: scale(1.15);
    box-shadow: ${global.shadows.tileHover};
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:hover::before {
    opacity: 1;
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${global.shadows.tileActive};
  }

  &.linkedActive {
    border: 1px solid rgba(0, 0, 0, 0.5);
    animation-name: ${DeviceBorderAnimation};
    animation-duration: 2.0s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }

  &.lockedActive {
    border: 1px solid rgba(255, 0, 0, 0.7);
    animation-name: ${DeviceBorderAnimation};
    animation-duration: 2.0s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
`;

export const ControlActionContainer = styled(ControlContainer) <{canDrop?: boolean}>`
  opacity: ${props => props.canDrop === false ? '.25' : '1'};
  transition: opacity .25s ease-in-out;
  justify-content: center;

  input[type="range"] {
    -webkit-appearance: slider-vertical;
  }

  ${props => props.canDrop && `
    div:nth-child(2) {
      display: flex;
    }
  `};
`;

// shared "glass" visual language reused across the room grid and the scene/rule/app dashboard cards
export const GlassPanel = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: ${global.borderRadius.lg};
  box-shadow: ${global.shadows.panel};
  backdrop-filter: ${global.blur.md};

  &:hover,
  &:focus-within,
  &.is-active {
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg,
        transparent 0%,
        rgba(130, 210, 255, 0.0) 30%,
        rgba(130, 210, 255, 0.5) 45%,
        rgba(230, 250, 255, 0.85) 52%,
        rgba(130, 210, 255, 0.5) 60%,
        rgba(130, 210, 255, 0.0) 75%,
        transparent 100%);
      opacity: 0.20;
      background-size: 240% 100%;
      background-position: 200% 0;
      filter: drop-shadow(0 0 10px rgba(120, 200, 255, 0.5));
      mix-blend-mode: screen;
      pointer-events: none;
      animation: dashboard-room-lightning 2.6s linear infinite;
    }
  }
`;

export const GlassPill = styled.span`
  display: inline-flex;
  padding: 0.4rem 0.75rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.25) 100%);
  box-shadow: ${global.shadows.pill};
  backdrop-filter: ${global.blur.lg};
  border-radius: ${global.borderRadius.sm};
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6),
               0 1px 2px rgba(0, 0, 0, 0.8);
  transition: ${global.transitions.smooth};

  &:hover {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%);
    box-shadow: ${global.shadows.pillHover};
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

// shared card layout for the scene/rule/app dashboard tabs
export const DashboardCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${global.measurements.dashboardGridGap};
  align-content: start;
  overflow: auto;
`;

export const DashboardCard = styled(GlassPanel)`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;
  min-width: 0;
`;

export const DashboardCardTitle = styled(GlassPill)`
  display: block;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DashboardCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const DashboardCardField = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.85rem;
  overflow: hidden;
`;

export const DashboardCardFieldLabel = styled.span`
  opacity: 0.6;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex: none;
`;

export const DashboardCardFieldValue = styled.span`
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DashboardCardActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
`;

export const DashboardActionButton = styled.button<{rgb?: string}>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #${props => props.rgb ?? global.palette.control.rgb.switch};
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.3) 100%);
  border: 1px solid #${props => props.rgb ?? global.palette.control.rgb.switch}66;
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.4) 100%);
    border-color: #${props => props.rgb ?? global.palette.control.rgb.switch};
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DashboardCardBadge = styled.span<{rgb: string}>`
  position: absolute;
  bottom: 0.6rem;
  left: 1rem;
  z-index: 1;
  padding: 0.2rem 0.65rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.85);
  background: linear-gradient(135deg, #${props => props.rgb} 0%, #${props => props.rgb}cc 100%);
  border-radius: 999px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
`;

export const DashboardChipToggle = styled.button<{selected: boolean; rgb?: string}>`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.selected ? 'rgba(0, 0, 0, 0.85)' : `#${props.rgb ?? global.palette.control.rgb.inactive}`};
  background: ${props => props.selected
    ? `linear-gradient(135deg, #${props.rgb ?? global.palette.control.rgb.inactive} 0%, #${props.rgb ?? global.palette.control.rgb.inactive}cc 100%)`
    : 'rgba(0, 0, 0, 0.3)'};
  border: 1px solid ${props => props.selected ? 'transparent' : `#${props.rgb ?? global.palette.control.rgb.inactive}55`};

  &:hover {
    transform: translateY(-1px);
  }
`;

export const DashboardTitle = styled.h2`
    font-weight: 700;
    font-size: 2rem;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0;
    padding: 1rem 0;
    position: relative;
    box-shadow: 0 15px 25px -15px rgba(0, 0, 0, 0.15);

    &::before {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(to left, currentColor, transparent);
        opacity: 0.3;
        max-width: 100px;
    }

    &::after {
        content: '';
        flex: 1;
        height: 2px;
        background: linear-gradient(to right, currentColor, transparent);
        opacity: 0.3;
    }
`;

export const DashboardSubTitle = styled.h3`
    font-weight: 500;
    font-size: 1rem;
    margin-top: 0.5rem;
    opacity: 0.8;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 1rem;
    display: none;

    &::before {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(to left, currentColor, transparent);
        opacity: 0.3;
    }
`;

export const DashboardGridColumnHeader = styled(FlexRowCenter)`
    display: flex;
    justify-content: center;
`;

// shared grid wrapper for tabular debug pages (locations/smartapps) that don't fit the DashboardCardGrid auto-fill
// card layout - each page supplies its own column template, and rowMinHeight only where rows need a minimum height
export const DashboardDataGrid = styled.div<{columns: string; rowMinHeight?: string}>`
    display: grid;
    grid-template-columns: ${props => props.columns};
    gap: ${global.measurements.dashboardGridGap};
    ${props => props.rowMinHeight && `grid-auto-rows: minmax(${props.rowMinHeight}, auto);`}
`;

export const StyledButton = styled.button.attrs({className: 'flex-row-center styled-button'})`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
`;
