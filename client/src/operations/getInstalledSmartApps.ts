const getInstalledSmartApps = (): IResponseSmartApps => {
    // TODO
    // const response = await fetch(`isa/${isaId}`);
    // const responseBody = await response.json();
    // return responseBody;
    return [
        'a087c8de-a8ef-46df-8069-1b2e9fa4f6d9'
    ];
};

export type IResponseSmartApps = string[];

export default getInstalledSmartApps;