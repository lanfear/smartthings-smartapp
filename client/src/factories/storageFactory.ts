// per-viewer conveniences only (remembered filters/selections) - storage can be unavailable (private mode, blocked

import type {Nullable} from '../types/sharedContracts';

// site data) or hold junk from an older version, so reads fall back to null and writes never throw
export const readStorage = <T>(key: string): Nullable<T> => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore - the setting just won't be remembered
  }
};
