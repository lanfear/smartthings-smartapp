import type {ErrorRequestHandler, RequestParamHandler} from 'express';
import {IpFilter as ipFilter} from 'express-ipfilter';
import {StatusCodes} from 'http-status-codes';

const localIps = process.env.LOCALIPS?.split(/,\s*/) ?? [];
export const localOnlyMiddleware = ipFilter(localIps, {mode: 'allow'});

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
  const statusCode = res.statusCode !== StatusCodes.OK as number ? res.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};
