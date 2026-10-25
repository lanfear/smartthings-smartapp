import type {IMeasurementType, IResponseMeasurementHistory} from '../types/sharedContracts';

export interface IMeasurementHistoryOptions {
  hours: number; // clamped server-side to the recording retention (MEASUREMENT_RETENTION_DAYS)
  deviceIds?: string[]; // restrict the series returned
  bucketMinutes?: number; // server averages points into buckets of this size, aligned across series
}

const getMeasurementHistory = async (locationId: string, measurement: IMeasurementType, options: IMeasurementHistoryOptions): Promise<IResponseMeasurementHistory> => {
  const query = new URLSearchParams({hours: `${options.hours}`});
  if (options.deviceIds?.length) {
    query.set('deviceIds', options.deviceIds.join(','));
  }
  if (options.bucketMinutes) {
    query.set('bucketMinutes', `${options.bucketMinutes}`);
  }
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/measurements/${measurement}/history?${query.toString()}`);
  return await response.json() as IResponseMeasurementHistory;
};

export default getMeasurementHistory;
