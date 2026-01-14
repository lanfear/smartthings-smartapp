interface ISettings {
  localIps: string[];
  environment: 'dev' | 'prod' | 'test';
  hostName: string;
  hostPort: number;
  redisServer: string;
  controlAppId: string;
  controlClientId: string;
  controlClientSecret: string;
  ruleAppId: string;
  ruleClientId: string;
  ruleClientSecret: string;
  apiToken: string;
  dataDirectory: string;
  dataRuleSet: string;
  debugLogging: boolean;
}

if (!process.env.CONTROL_APP_ID || !process.env.CONTROL_CLIENT_ID || !process.env.CONTROL_CLIENT_SECRET
    || !process.env.RULE_APP_ID || !process.env.RULE_CLIENT_ID || !process.env.RULE_CLIENT_SECRET
|| !process.env.API_TOKEN || !process.env.REDIS_SERVER
) {
  throw new Error('One or more required environment variables are not set.');
}

const settings: ISettings = {
  localIps: process.env.LOCALIPS?.split(/,\s*/) ?? [],
  environment: (process.env.ENV_TYPE ?? 'dev') as ISettings['environment'],
  hostName: process.env.STHOST ?? 'localhost',
  hostPort: parseInt(process.env.STPORT ?? '3001', 10) || 3001, // eslint-disable-line @typescript-eslint/no-magic-numbers
  redisServer: process.env.REDIS_SERVER,
  controlAppId: process.env.CONTROL_APP_ID,
  controlClientId: process.env.CONTROL_CLIENT_ID,
  controlClientSecret: process.env.CONTROL_CLIENT_SECRET,
  ruleAppId: process.env.RULE_APP_ID,
  ruleClientId: process.env.RULE_CLIENT_ID,
  ruleClientSecret: process.env.RULE_CLIENT_SECRET,
  apiToken: process.env.API_TOKEN,
  dataDirectory: process.env.DATA_DIRECTORY ?? 'data',
  dataRuleSet: process.env.DATA_RULESET ?? 'rules.json',
  debugLogging: process.env.LOGGING_EVENTS_ENABLED?.toLowerCase() === 'true'
};

export default settings;