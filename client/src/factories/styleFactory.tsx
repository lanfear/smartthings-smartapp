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

export const ActionLogo = styled.div<{fontSize?: string}>`
  font-size: ${props => props.fontSize ?? 'x-large'};
`;

export const ControlLogo = styled(ActionLogo)`
  position: absolute;
  height: 100%;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 50%;
  z-index: -1;
`;

export const ControlStatus = styled.div`
    font-weight: 700;
    line-height: 1;
    background: #9995;
    border-radius: 10px;
    padding: 0.125rem 0;
    min-width: 80%;
`;

export const ControlIcon = styled.div<{fontSize?: string}>`
  font-size: ${props => props.fontSize ?? 'unset'};
  display: flex;
  width: 100%;
  justify-content: space-between;
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
  background: #${props => props.rgb}${global.palette.control.alpha};
  box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );
  backdrop-filter: blur( 15px );
  border-radius: 10px;
  border: 1px solid rgba( 255, 255, 255, 0.18 );
  margin: ${global.measurements.deviceMargin};
  transition : border 500ms pulse;

  &.linkedActive {
    border: 1px solid #000;
    animation-name: ${DeviceBorderAnimation};
    animation-duration: 2.0s;
    animation-timing-function: ease-in-out;
    animation-iteration-count:infinite;
  }

  &.lockedActive {
    border: 1px solid #f00;
    animation-name: ${DeviceBorderAnimation};
    animation-duration: 2.0s;
    animation-timing-function: ease-in-out;
    animation-iteration-count:infinite;
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
    font-weight: 600;
`;

export const DashboardSubTitle = styled.h3`
    font-weight: 600;
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
