import type {IResponseActivity} from '../types/sharedContracts';

// hours is clamped server-side to the recording retention (MEASUREMENT_RETENTION_DAYS)
const getActivity = async (locationId: string, hours: number): Promise<IResponseActivity> => {
  const query = new URLSearchParams({hours: `${hours}`});
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/activity?${query.toString()}`);
  return await response.json() as IResponseActivity;
};

export default getActivity;
