"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const http_status_codes_1 = require("http-status-codes");
// eslint-disable-next-line @typescript-eslint/ban-types
const notFound = (req, res, next) => {
    if (process.env.REACT_APP) {
        next();
    }
    else { // In order to show custom error 404 page
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND);
        const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
        next(error);
    }
};
exports.notFound = notFound;
// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars
const errorHandler = (err, _, res, __) => {
    const statusCode = res.statusCode !== http_status_codes_1.StatusCodes.OK ? res.statusCode : http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=middlewares.js.map