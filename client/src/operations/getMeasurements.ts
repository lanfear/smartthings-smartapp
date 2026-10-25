import type {IMeasurementType, IResponseMeasurements} from '../types/sharedContracts';

const getMeasurements = async (locationId: string, measurement: IMeasurementType): Promise<IResponseMeasurements> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/measurements/${measurement}`);
  return await response.json() as IResponseMeasurements;
};

export default getMeasurements;
