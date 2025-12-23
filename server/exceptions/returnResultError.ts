import {StatusCodes} from 'http-status-codes';

export default class ReturnResultError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: StatusCodes) {
    super(message);
    this.name = 'ReturnResultError';
    this.statusCode = statusCode;
  }
}
