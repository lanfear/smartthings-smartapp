import {ResponseLocation} from '../types/sharedContracts';

const getLocation = async (locationId: string): Promise<ResponseLocation> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/location/${locationId}`);
  return await response.json() as ResponseLocation;
};

export default getLocation;