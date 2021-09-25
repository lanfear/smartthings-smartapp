const getInstalledSmartApp = async (isaId: string): Promise<IResponseSmartApp> => {
    const response = await fetch(`http://localhost:9190/isa/${isaId}`);
    const responseBody = await response.json();
    return responseBody as IResponseSmartApp;
};

export interface IResponseSmartApp {
    installedAppId: string;
    scenes: any[]; // TODO;
    switches: any[]; // TODO;
    locks: any[]; // TODO
}

export default getInstalledSmartApp;

//75e51574-a8fe-40ad-97a7-e46d577ac2c7