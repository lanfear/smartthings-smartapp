import { Device, Rule, SceneSummary } from "@smartthings/core-sdk";
import { IDevice, IRule } from "../types/smartthingsExtensions";

const getInstalledSmartApp = async (isaId: string): Promise<IResponseSmartApp> => {
    const response = await fetch(`http://localhost:9190/app/${isaId}`);
    const responseBody = await response.json();
    return responseBody as IResponseSmartApp;
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