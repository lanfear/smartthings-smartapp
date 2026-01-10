import {IResponseLocation} from '../types/sharedContracts';

const getLocation = async (locationId: string): Promise<IResponseLocation> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}`);
  return await response.json() as IResponseLocation;
};

export default getLocation;
