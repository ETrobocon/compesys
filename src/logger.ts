import { NextFunction, Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import { pino } from 'pino';
import { HttpLogger, pinoHttp } from 'pino-http';
import { SerializedRequest, SerializedResponse } from 'pino-std-serializers';
import { fileURLToPath } from 'url';

const LOG_FILE_PATH = '/var/log/compesys/server.log';

export class CustomLogger {
  private _logLevel: string;
  private _loggerOption: pino.Logger;
  private _serializers: {
    req: (req: CustomSerializedRequest) => CustomSerializedRequest;
    res: (res: CustomSerializedResponse) => CustomSerializedResponse;
  };

  public constructor() {
    this._logLevel = process.env.PINO_LOG_LEVEL ?? 'info';
    this._loggerOption = pino({
      level: this._logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: { pid: process.pid },
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
      transport: {
        target: path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          'logTransport',
        ),
        options: {
          prettyOptions: { colorize: true },
          filePath: LOG_FILE_PATH,
          mkdir: true,
        },
      },
    });
    this._serializers = {
      req: (req: CustomSerializedRequest): CustomSerializedRequest => {
        try {
          if (typeof req.raw.body === 'string') {
            req.body = JSON.parse(req.raw.body);
          }
        } catch {
          return req;
        }
        return req;
      },
      res: (res: CustomSerializedResponse): CustomSerializedResponse => {
        res.headers = {
          'x-ratelimit-limit': res.headers['x-ratelimit-limit'],
          'x-ratelimit-remaining': res.headers['x-ratelimit-remaining'],
        };
        try {
          if (typeof res.raw.body === 'string') {
            res.body = JSON.parse(res.raw.body);
          }
        } catch {
          return res;
        }
        return res;
      },
    };
  }

  public get loggerOption(): pino.Logger {
    return this._loggerOption;
  }

  public get loggerMiddleware(): HttpLogger {
    return pinoHttp({
      logger: this._loggerOption,
      serializers: this._serializers,
    });
  }
}

export class ResponseBodyCaptureMiddleware {
  public static captureResponseBody = (
    _req: Request,
    res: CustomResponse,
    next: NextFunction,
  ): void => {
    res.body = undefined;
    const originalSend = res.send;
    res.send = function (body: unknown) {
      res.body = body;
      return originalSend.call(this, body);
    };
    next();
  };
}

interface CustomSerializedRequest<ReqBody = unknown> extends SerializedRequest {
  body: ReqBody;
  raw: CustomIncomingMessage<ReqBody>;
}

interface CustomIncomingMessage<ReqBody = unknown> extends IncomingMessage {
  body: ReqBody;
}

interface CustomSerializedResponse<ResBody = unknown>
  extends SerializedResponse {
  body: ResBody;
  raw: CustomServerResponse<ResBody>;
}

interface CustomServerResponse<ResBody = unknown> extends ServerResponse {
  body: ResBody;
}

interface CustomResponse<ResBody = unknown> extends Response<ResBody> {
  body?: ResBody;
}
