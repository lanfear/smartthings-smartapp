import { IDeviceResponse, IRuleResponse, ISceneResponse } from "../types/apiResponses";

const getInstalledSmartApp = async (isaId: string): Promise<IResponseSmartApp> => {
    const response = await fetch(`http://localhost:9190/isa/${isaId}`);
    const responseBody = await response.json();
    return responseBody as IResponseSmartApp;
};

export interface IResponseSmartApp {
    installedAppId: string;
    scenes: ISceneResponse[];
    switches: IDeviceResponse[];
    locks: IDeviceResponse[];
    motion: IDeviceResponse[];
    rules: IRuleResponse[];
}

export default getInstalledSmartApp;