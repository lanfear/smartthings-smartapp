import {ResponseLocks, ResponseMotion, ResponseRooms, ResponseRules, ResponseScenes, ResponseSwitches} from '../types/sharedContracts';

const getInstalledSmartApp = async (isaId: string): Promise<IResponseSmartApp> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/app/${isaId}`);
  return await response.json() as IResponseSmartApp;
};

export interface IResponseSmartApp {
  installedAppId: string;
  rooms: ResponseRooms;
  scenes: ResponseScenes;
  switches: ResponseSwitches;
  locks: ResponseLocks;
  motion: ResponseMotion;
  rules: ResponseRules;
}

export default getInstalledSmartApp;