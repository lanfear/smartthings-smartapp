import {Device, Rule} from '@smartthings/core-sdk';

export type IDevice = Device & { value: string };

export type IRule = Rule & {
    executionLocation?: string;
    ownerType?: string;
    ownerId?: string;
    creator?: string;
    dateCreated: Date;
    dateUpdated?: Date;
};