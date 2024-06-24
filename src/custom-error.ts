import { NextFunction, Request, Response } from 'express';

import CustomErrorJsonResponse from '@/interfaces/response/customErrorJson';
import CustomJsonResponse from '@/interfaces/response/customJson';

enum HttpStatusCode {
  BadRequest = 400,
  Forbidden = 403,
  NotFound = 404,
  TooManyRequests = 429,
  InternalServerError = 500,
}

const HttpStatus = {
  [HttpStatusCode.BadRequest]: 'Bad Request',
  [HttpStatusCode.Forbidden]: 'Forbidden',
  [HttpStatusCode.NotFound]: 'Not Found',
  [HttpStatusCode.TooManyRequests]: 'Too Many Requests',
  [HttpStatusCode.InternalServerError]: 'Internal Server Error',
};

export class CustomError extends Error {
  public statusCode: HttpStatusCode;
  public status: string;

  constructor(statusCode: HttpStatusCode, message: string) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.status =
      HttpStatus[statusCode] ?? HttpStatus[HttpStatusCode.InternalServerError];
  }

  public toResponse(): CustomErrorJsonResponse {
    return {
      status: this.status,
      message: this.message,
    };
  }
}

export class ErrorMiddleware {
  public static error = (
    err: CustomError | Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ) => {
    if (err instanceof CustomError) {
      res.status(err.statusCode).json(err.toResponse());
      return;
    }

    const response: CustomJsonResponse = {
      status: HttpStatus[HttpStatusCode.InternalServerError],
    };
    res.status(HttpStatusCode.InternalServerError).json(response);
  };
}
