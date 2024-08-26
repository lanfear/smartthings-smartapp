import isPropValid from '@emotion/is-prop-valid';
import {IStyleSheetContext, StyleSheetManager} from 'styled-components';

// This implements the default behavior from styled-components v5
const shouldForwardProp: IStyleSheetContext['shouldForwardProp'] = (propName, target) => {
  if (typeof target === 'string') {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName);
  }
  // For other elements, forward all props
  return true;
};

const StyledComponentProvider: React.FC<IStyledComponentsProviderProps> = ({children}) => (
  <StyleSheetManager shouldForwardProp={shouldForwardProp}>
    {children}
  </StyleSheetManager>
);

export interface IStyledComponentsProviderProps {
  children: React.ReactNode;
}

export default StyledComponentProvider;
