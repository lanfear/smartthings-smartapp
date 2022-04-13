import {IResponseLocation} from '../types/sharedContracts';

const getLocation = async (locationId: string): Promise<IResponseLocation> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/location/${locationId}`);
  return await response.json() as IResponseLocation;
};

export default getLocation;