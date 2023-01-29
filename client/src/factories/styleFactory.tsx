import styled from 'styled-components';
import global from '../constants/global';

export const ControlIcon = styled.div<{fontSize?: string}>`
  font-size: ${props => props.fontSize ?? 'larger'};
`;

export const ControlStatus = styled.div`
  font-size: smaller;
  font-weight: 500;
`;

export const ControlContainer = styled.button<{rgb: string}>`
  height: 3.5rem;
  width: 3.5rem;
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
  margin: 0.125rem;
`;

export const ControlActionContainer = styled(ControlContainer) <{canDrop?: boolean}>`
  opacity: ${props => props.canDrop === false ? '.25' : '1'};
  transition: opacity .25s ease-in-out;

  input[type="range"] {
    -webkit-appearance: slider-vertical;
  }

`;
