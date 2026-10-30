import path from 'path';

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
  localesDirectory: string;
  debugLogging: boolean;
  measurementPollMinutes: number;
  measurementRetentionDays: number;
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
  // server/locales, resolved from the compiled server/build/provider/settings.js so it works from any cwd
  localesDirectory: path.resolve(__dirname, '..', '..', 'locales'),
  debugLogging: process.env.LOGGING_EVENTS_ENABLED?.toLowerCase() === 'true',
  // how often the server records measurement readings (temperature/humidity/battery) into redis for the history graphs (0 disables recording)
  measurementPollMinutes: Math.max(0, parseFloat(process.env.MEASUREMENT_POLL_MINUTES ?? '5') || 0),
  // how many days of recorded readings to keep
  measurementRetentionDays: Math.max(1, parseFloat(process.env.MEASUREMENT_RETENTION_DAYS ?? '30') || 30) // eslint-disable-line @typescript-eslint/no-magic-numbers
};

export default settings;