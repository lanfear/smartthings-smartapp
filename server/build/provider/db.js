"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dataDirectory = process.env.DATA_DIRECTORY || 'data';
const ruleStore = process.env.DATA_RULESTORE || 'rules.json';
const extLength = 5;
exports.default = {
    listInstalledApps: () => fs_1.default.readdirSync(dataDirectory).map((it) => it.substring(0, it.length - extLength)),
    dataDirectory: dataDirectory,
    ruleStorePath: `${dataDirectory}/${ruleStore}`
};
//# sourceMappingURL=db.js.map