import type {Nullable} from 'types/sharedContracts';
import type {IServiceValue} from '../operations/readWeatherFromApiOperation';

const fahrenheitFactor = 1.8;
const fahrenheitOffset = 32;
const mphPerKmh = 0.621371;
const mmPerInch = 25.4;
const mmPerCm = 10;
const roundTo = (value: number, digits: number): number => Math.round(value * (10 ** digits)) / (10 ** digits);

/** the service value's number, or null when it's missing or not a number */
export const readNumber = (v: IServiceValue | undefined): Nullable<number> => (typeof v?.value === 'number' && Number.isFinite(v.value) ? v.value : null);

export const readString = (v: IServiceValue | undefined): Nullable<string> => (typeof v?.value === 'string' && v.value ? v.value : null);

/** a temperature in °C, whichever scale the service reported it in (it reports °C, but says so per value) */
export const readCelsius = (v: IServiceValue | undefined): Nullable<number> => {
  const value = readNumber(v);
  if (value === null) {
    return null;
  }
  return v?.unit?.toUpperCase() === 'F' ? roundTo((value - fahrenheitOffset) / fahrenheitFactor, 1) : value;
};

/** a speed in km/h (the service reports 'Km/h'; mph is converted) */
export const readKmh = (v: IServiceValue | undefined): Nullable<number> => {
  const value = readNumber(v);
  if (value === null) {
    return null;
  }
  return v?.unit?.toLowerCase() === 'mph' ? roundTo(value / mphPerKmh, 1) : value;
};

/** a precipitation amount in mm (snow is reported in cm) */
export const readMm = (v: IServiceValue | undefined): Nullable<number> => {
  const value = readNumber(v);
  if (value === null) {
    return null;
  }
  const unit = v?.unit?.toLowerCase();
  return unit === 'cm' ? value * mmPerCm : unit === 'in' ? roundTo(value * mmPerInch, 1) : value;
};

export const celsiusToScale = (celsius: Nullable<number>, scale: 'F' | 'C'): Nullable<number> => {
  if (celsius === null) {
    return null;
  }
  return scale === 'F' ? roundTo((celsius * fahrenheitFactor) + fahrenheitOffset, 1) : celsius;
};

export const kmhToScale = (kmh: Nullable<number>, scale: 'F' | 'C'): Nullable<number> => {
  if (kmh === null) {
    return null;
  }
  return scale === 'F' ? roundTo(kmh * mphPerKmh, 0) : kmh;
};

export const mmToScale = (mm: Nullable<number>, scale: 'F' | 'C'): Nullable<number> => {
  if (mm === null) {
    return null;
  }
  return scale === 'F' ? roundTo(mm / mmPerInch, 2) : mm;
};
