import {BearerTokenAuthenticator, SmartThingsClient} from '@smartthings/core-sdk';
import type {Nullable} from 'types';
import settings from './settings';

// singleton client instance
let stClient: Nullable<SmartThingsClient> = null;

const getSmartThingsClient = (): SmartThingsClient => stClient ?? (stClient = new SmartThingsClient(new BearerTokenAuthenticator(settings.apiToken)));

export default getSmartThingsClient;