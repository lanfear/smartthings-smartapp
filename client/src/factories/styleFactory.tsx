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
  background: linear-gradient(135deg, #${props => props.rgb}${global.palette.control.alpha} 0%, #${props => props.rgb}dd 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1),
              0 8px 32px rgba(31, 38, 135, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(1.2);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  margin: ${global.measurements.deviceMargin};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12),
                0 12px 40px rgba(31, 38, 135, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:hover::before {
    opacity: 1;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1),
                0 4px 16px rgba(31, 38, 135, 0.15);
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

  input[type="range"] {
    -webkit-appearance: slider-vertical;
  }
`;

export const DashboardTitle = styled.h2`
    font-weight: 700;
    font-size: 2rem;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 1rem;

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

export const StyledButton = styled.button.attrs({className: 'flex-row-center styled-button'})`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
`;
