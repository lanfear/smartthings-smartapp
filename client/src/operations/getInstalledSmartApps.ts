const getInstalledSmartApps = (): IResponseSmartApps => {
    // TODO
    // const response = await fetch(`isa/${isaId}`);
    // const responseBody = await response.json();
    // return responseBody;
    return [
        '75e51574-a8fe-40ad-97a7-e46d577ac2c7'
    ];
};

export type IResponseSmartApps = string[];

export default getInstalledSmartApps;