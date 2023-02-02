import styled from 'styled-components';
import global from '../constants/global';

export const ActionLogo = styled.div<{ fontSize?: string }>`
  font-size: ${props => props.fontSize ?? 'xx-large'};
`;

export const ControlLogo = styled(ActionLogo)`
  position: absolute;
  justify-self: center;
  align-self: center;
  opacity: 50%;
  z-index: -1;
`;

export const ControlStatus = styled.div`
    font-weight: 700;
`;

export const ControlContainer = styled.button<{rgb: string}>`
  height: ${global.measurements.deviceWidth};
  width: ${global.measurements.deviceWidth};
  display: flex;
  flex: none;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: space-evenly;
  border-radius: 4px;
  background: #${props => props.rgb}${global.palette.control.alpha};
  box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );
  backdrop-filter: blur( 15px );
  border-radius: 10px;
  border: 1px solid rgba( 255, 255, 255, 0.18 );
  margin: ${global.measurements.deviceMargin};
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

export const DashboardGridColumnHeader = styled.span`
    display: flex;
    justify-content: center;
`;
