import fs from 'fs';
import settings from './settings';

const extLength = 5;

export default {
  listInstalledApps: (): string[] => fs.readdirSync(settings.dataDirectory).map((it: string) => it.substring(0, it.length - extLength)),
  dataDirectory: settings.dataDirectory,
  ruleStorePath: `${settings.dataDirectory}/${settings.dataRuleSet}`
};
