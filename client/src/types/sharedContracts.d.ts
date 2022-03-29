// types in this file should be copied to corresponding file in server directory as these
// contracts are shared from server to client

export type ISseEventType = 'switch' | 'lock' | 'motion' | 'rule';

export interface ISseEvent
{
  deviceId: string;
  value: string;
}

export interface ISseRuleEvent {
  appId: string;
}