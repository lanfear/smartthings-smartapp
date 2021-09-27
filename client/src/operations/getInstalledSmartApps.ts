const getInstalledSmartApps = (): IResponseSmartApps => {
    // TODO
    // const response = await fetch(`isa/${isaId}`);
    // const responseBody = await response.json();
    // return responseBody;
    return [
        '597ef1ac-cb15-4e10-a354-9a94849b6c15'
    ];
};

export type IResponseSmartApps = string[];

export default getInstalledSmartApps;