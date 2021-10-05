const getInstalledSmartApps = async (): Promise<IResponseSmartApps> => {
  const response = await fetch('http://localhost:9190/app');
  return await response.json() as IResponseSmartApps;
};

export type IResponseSmartApps = string[];

export default getInstalledSmartApps;