import styled from 'styled-components';

export const ControlIcon = styled.div`
  font-size: larger;
`;

export const ControlStatus = styled.div`
  font-size: smaller;
  font-weight: 500;
`;

export const ControlContainer = styled.button<{rgb: string}>`
  height: 3.75rem;
  width: 3.75rem;
  display: flex;
  flex: none;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: space-evenly;
  border-radius: 4px;
  background: #${props => props.rgb}66;
  box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );
  backdrop-filter: blur( 15px );
  border-radius: 10px;
  border: 1px solid rgba( 255, 255, 255, 0.18 );
`;
