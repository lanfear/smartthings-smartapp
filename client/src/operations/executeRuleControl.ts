const executeRuleControl = async (installedAppId: string, rulePart: string): Promise<Response> => {
  const response = await fetch(`${process.env.REACT_APP_APIHOST as string}/rule/${installedAppId}/${rulePart}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  });
    
  return response;
};

export default executeRuleControl;