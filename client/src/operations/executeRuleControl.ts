import {IRuleComponentType} from '../types/sharedContracts';

const executeRuleControl = async (locationId: string, installedAppId: string, ruleComponent: IRuleComponentType | 'all', ruleEnabled: boolean): Promise<Response> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST!}/location/${locationId}/rule/${installedAppId}/${ruleComponent}/${ruleEnabled.toString()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response;
};

export default executeRuleControl;
