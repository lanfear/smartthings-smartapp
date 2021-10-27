import {SceneSummary} from '@smartthings/core-sdk';
import {IDevice, IRule} from '../types/smartthingsExtensions';

const getInstalledSmartApp = async (isaId: string): Promise<IResponseSmartApp> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/app/${isaId}`);
  return await response.json() as IResponseSmartApp;
};

export interface IResponseSmartApp {
  installedAppId: string;
  scenes: SceneSummary[];
  switches: IDevice[];
  locks: IDevice[];
  motion: IDevice[];
  rules: IRule[];
}

export default getInstalledSmartApp;