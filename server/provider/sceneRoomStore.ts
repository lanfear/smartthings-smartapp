import {createClient} from 'redis';
import settings from './settings';

const sceneRoomMapPrefix = 'st-sceneroommap-';
const redisSceneRoomStore = createClient({
  url: settings.redisServer
});

const get = async (locationId: string): Promise<Record<string, string[]>> => {
  if (!redisSceneRoomStore.isOpen) {
    await redisSceneRoomStore.connect();
  }
  const sceneRoomMapString = await redisSceneRoomStore.get(`${sceneRoomMapPrefix}${locationId}`);
  return sceneRoomMapString ? JSON.parse(sceneRoomMapString) as Record<string, string[]> : {};
};

const setRoomsForScene = async (locationId: string, sceneId: string, roomIds: string[]): Promise<void> => {
  if (!redisSceneRoomStore.isOpen) {
    await redisSceneRoomStore.connect();
  }
  const sceneRoomMap = await get(locationId);
  sceneRoomMap[sceneId] = roomIds;
  await redisSceneRoomStore.set(`${sceneRoomMapPrefix}${locationId}`, JSON.stringify(sceneRoomMap));
};

export default {
  get,
  setRoomsForScene
};
