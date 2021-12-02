// types in this file should be copied to corresponding file in server directory as these
// contracts are shared from server to client

export type ISSEEventType = 'switch' | 'lock' | 'motion';

export interface ISSEEvent
{
  deviceId: string;
  value: string;
}