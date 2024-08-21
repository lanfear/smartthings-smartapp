import {IResponseLocks, IResponseMotion, IResponseRooms, IResponseRules, IResponseScenes, IResponseSwitches} from '../types/sharedContracts';

const getInstalledSmartApp = async (isaId: string): Promise<IResponseSmartApp> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST as string}/app/${isaId}`);
  return await response.json() as IResponseSmartApp;
};

export interface IResponseSmartApp {
  installedAppId: string;
  rooms: IResponseRooms;
  scenes: IResponseScenes;
  switches: IResponseSwitches;
  locks: IResponseLocks;
  motion: IResponseMotion;
  rules: IResponseRules;
}

export default getInstalledSmartApp;
