const executeScene = async (locationId: string, sceneId: string): Promise<Response> => await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/scenes/${sceneId}`, {
  method: 'POST'
});

export default executeScene;
