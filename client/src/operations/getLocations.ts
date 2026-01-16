import type {LocationItem} from '@smartthings/core-sdk';

const getLocations = async (): Promise<IResponseLocations> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/locations`);
  return await response.json() as IResponseLocations;
};

export type IResponseLocations = LocationItem[];

export default getLocations;
