"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ReturnResultError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'ReturnResultError';
        this.statusCode = statusCode;
    }
}
exports.default = ReturnResultError;
//# sourceMappingURL=returnResultError.js.map