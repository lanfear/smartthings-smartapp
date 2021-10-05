import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

// eslint-disable-next-line @typescript-eslint/ban-types
export const notFound = (req: Request, res: Response, next: Function): void => {
  if (process.env.REACT_APP) {
    next();
  } else { // In order to show custom error 404 page
    res.status(StatusCodes.NOT_FOUND);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
  }
};

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, _: Request, res: Response, __: Function): void => {
  const statusCode = res.statusCode !== StatusCodes.OK ? res.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};