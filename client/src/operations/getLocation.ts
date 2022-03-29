import {InstalledApp, Room, SceneSummary} from '@smartthings/core-sdk';
import {IDevice, IRule} from '../types/smartthingsExtensions';

const getLocation = async (locationId: string): Promise<IResponseLocation> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/location/${locationId}`);
  return await response.json() as IResponseLocation;
};

export interface IResponseLocation {
  locationId: string;
  rooms: Room[];
  scenes: SceneSummary[];
  switches: IDevice[];
  locks: IDevice[];
  motion: IDevice[];
  rules: IRule[];
  apps: InstalledApp[];
}

export default getLocation;