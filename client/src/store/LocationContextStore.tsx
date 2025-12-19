import {create} from 'zustand';
import {Nullable} from '../types/interfaces';

export interface ILocationContextStore {
  locationId: Nullable<string>;
  locationName: Nullable<string>;
}

const defaultContext: ILocationContextStore = {
  locationId: null,
  locationName: null
};

export const useLocationContextStore = create<ILocationContextStore>(() => defaultContext);

export const setLocation = (locationId: string, locationName: string): void => {
  if (useLocationContextStore.getState().locationId === locationId) {
    return;
  }
  useLocationContextStore.setState(p => ({...p, locationId, locationName}));
};
