import {create} from 'zustand';
import getLocations from '../operations/getLocations';
import type {Nullable} from '../types/interfaces';

export interface ILocationContextStore {
  locationId: Nullable<string>;
  locationName: Nullable<string>;
}

const defaultContext: ILocationContextStore = {
  locationId: null,
  locationName: null
};

export const useLocationContextStore = create<ILocationContextStore>(() => defaultContext);

export const setLocation = (locationId: string, locationName: Nullable<string> = null): void => {
  if (useLocationContextStore.getState().locationId === locationId) {
    return;
  }
  if (!locationName) {
    void (async () => {
      const locationData = (await getLocations()).find(l => l.locationId === locationId);
      if (locationData) {
        useLocationContextStore.setState(p => ({...p, locationId: locationId, locationName: locationData.name}));
      }
    })();
    return;
  }

  useLocationContextStore.setState(p => ({...p, locationId, locationName}));
};
