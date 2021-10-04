import {Request, Response} from 'express';

function notFound(req: Request, res: Response, next: Function) {
    if (process.env.REACT_APP) {
        next();
    } // In order to show custom error 404 page
    else {
        res.status(404);
        const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
        next(error);
    }
}

function errorHandler(err: Error, req: Request, res: Response, next: Function) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
}

module.exports = {
    notFound,
    errorHandler
};