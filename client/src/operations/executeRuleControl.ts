import type {Nullable} from '../types/interfaces';
import type {IRuleComponentType} from '../types/sharedContracts';

const executeRuleControl = async (locationId: string, installedAppId: string, ruleComponent: IRuleComponentType | 'all', ruleEnabled: boolean, reEnableAfter: Nullable<number> = null): Promise<Response> => {
  const response = await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/rule/${installedAppId}/${ruleComponent}/${ruleEnabled.toString()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    // eslint-disable-next-line no-undefined
    body: reEnableAfter ? JSON.stringify({reEnable: reEnableAfter}) : undefined
  });

  return response;
};

export default executeRuleControl;
