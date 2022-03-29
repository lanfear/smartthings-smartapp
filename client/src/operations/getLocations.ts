import {LocationItem} from '@smartthings/core-sdk';

const getLocations = async (): Promise<IResponseLocations> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/locations`);
  return await response.json() as IResponseLocations;
};

export type IResponseLocations = LocationItem[];

export default getLocations;