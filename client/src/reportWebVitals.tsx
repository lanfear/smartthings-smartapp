/* eslint-disable no-console */
import {onCLS, onFCP, onFID, onLCP, onTTFB} from 'web-vitals';

const reportWebVitals = (): void => {
  onCLS(console.info);
  onFID(console.info);
  onFCP(console.info);
  onLCP(console.info);
  onTTFB(console.info);
};

export default reportWebVitals;
