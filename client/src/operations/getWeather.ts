import type {IResponseWeather} from '../types/sharedContracts';

const getWeather = async (locationId: string, hours: number): Promise<IResponseWeather> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/weather?hours=${hours}`);
  return await response.json() as IResponseWeather;
};

export default getWeather;
