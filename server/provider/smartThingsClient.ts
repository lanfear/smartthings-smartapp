import {BearerTokenAuthenticator, SmartThingsClient} from '@smartthings/core-sdk';
import type {Nullable} from 'types';

// singleton client instance
let stClient: Nullable<SmartThingsClient> = null;

const getSmartThingsClient = (): SmartThingsClient => stClient ?? (stClient = new SmartThingsClient(new BearerTokenAuthenticator(process.env.CONTROL_API_TOKEN!)));

export default getSmartThingsClient;