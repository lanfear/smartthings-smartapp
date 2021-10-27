const getInstalledSmartApps = async (): Promise<IResponseSmartApps> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/app`);
  return await response.json() as IResponseSmartApps;
};

export type IResponseSmartApps = string[];

export default getInstalledSmartApps;