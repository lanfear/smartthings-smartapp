"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create = (devices) => devices.filter((s, i, self) => s && self.findIndex(c => (c === null || c === void 0 ? void 0 : c.deviceId) === s.deviceId) === i);
exports.default = create;
//# sourceMappingURL=uniqueDeviceFactory.js.map