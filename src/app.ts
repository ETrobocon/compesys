import { DEFAULT_LISTEN_PORT, MATCHMAKER_IP } from './constants';

import 'dotenv/config';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AddressInfo } from 'net';

import { ErrorMiddleware } from '@/custom-error';
import Matchmaker from '@/infrastructure/http/express/routes/matchmaker';
import Snap from '@/infrastructure/http/express/routes/snap';
import Version from '@/infrastructure/http/express/routes/version';
import { CustomLogger, ResponseBodyCaptureMiddleware } from '@/logger';

const app = express();
const customLogger = new CustomLogger();
const loggerMiddleware = customLogger.loggerMiddleware;
const loggerOption = loggerMiddleware.logger;

const whitelist = [MATCHMAKER_IP];

const customKeyGenerator = (req: Request): string => {
  const ip = req.ip;
  if (ip === undefined) {
    return '';
  }
  if (whitelist.includes(ip)) {
    return 'whitelist';
  }
  return ip ?? '0.0.0.0';
};

const limiter = rateLimit({
  windowMs: 1000,
  max: 10,
  keyGenerator: customKeyGenerator,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      message: 'Rate limit exceeded',
    });
  },
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(ResponseBodyCaptureMiddleware.captureResponseBody);
app.use(loggerMiddleware);

app.use(limiter);

app.use('/', Snap);
app.use('/', Version);
app.use('/', Matchmaker);
app.use(({ res }) => {
  res?.status(404).json({
    status: 'Not Found',
  });
});

app.use(ErrorMiddleware.error);

const server = app.listen(
  process.env.LISTEN_PORT !== undefined
    ? Number(process.env.LISTEN_PORT)
    : DEFAULT_LISTEN_PORT,
  '0.0.0.0',
  () => {
    loggerOption.info(
      'server listening on PORT:' + (server.address() as AddressInfo).port,
    );
  },
);

const handleShutdown = (signal: string) => {
  loggerOption.info(`Received ${signal}. Shutting down gracefully.`);
  server?.close(() => {
    loggerOption.info('Closed out remaining connections.');
    process.exit(0);
  });

  setTimeout(() => {
    loggerOption.error(
      'Could not close connections in time, forcefully shutting down',
    );
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export default app;
