import fs from 'fs';
const dataDirectory = process.env.DATA_DIRECTORY || 'data';
const ruleStore = process.env.DATA_RULESTORE || 'rules.json';
const extLength = 5;

export default {
  listInstalledApps: (): string[] => fs.readdirSync(dataDirectory).map((it: string) => it.substring(0, it.length - extLength)),
  dataDirectory: dataDirectory,
  ruleStorePath: `${dataDirectory}/${ruleStore}`
};
