/* eslint-disable no-console */
import {onCLS, onFCP, onINP, onLCP, onTTFB} from 'web-vitals';

const reportWebVitals = (): void => {
  onCLS(console.info);
  onINP(console.info);
  onFCP(console.info);
  onLCP(console.info);
  onTTFB(console.info);
};

export default reportWebVitals;
