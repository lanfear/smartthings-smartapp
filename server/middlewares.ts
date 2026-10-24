import type {ErrorRequestHandler, RequestParamHandler} from 'express';
import {IpFilter as ipFilter} from 'express-ipfilter';
import {StatusCodes} from 'http-status-codes';
import settings from './provider/settings';

export const localOnlyMiddleware = ipFilter(settings.localIps, {mode: 'allow'});

export const notFound: RequestParamHandler = (req, res, next): void => {
  if (process.env.REACT_APP) {
    next();
  } else { // In order to show custom error 404 page
    res.status(StatusCodes.NOT_FOUND);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
  }
};

export const errorHandler: ErrorRequestHandler = (err: Error, _, res): void => {
  const okStatusCode: number = StatusCodes.OK; // widen the enum so it compares cleanly with the numeric res.statusCode
  const statusCode = res.statusCode !== okStatusCode ? res.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: settings.environment === 'dev' ? err.stack : '🥞'
  });
};
