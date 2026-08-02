const setSceneRooms = async (locationId: string, sceneId: string, roomIds: string[]): Promise<Response> => await fetch(`${process.env.SMARTAPP_BUILDTIME_APIHOST}/location/${locationId}/scenes/${sceneId}/rooms`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({roomIds})
});

export default setSceneRooms;
