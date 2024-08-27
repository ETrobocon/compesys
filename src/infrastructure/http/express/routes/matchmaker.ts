import cors from 'cors';
import express, { Request, Response } from 'express';
import expressWs from 'express-ws';
import ws from 'ws';

import { STATE } from '@/constants';
import { CustomError } from '@/custom-error';
import OsEnvironmentVariablesReader from '@/infrastructure/environmentVariables/osEnvironmentVariablesReader';
import MatchmakerInjector from '@/infrastructure/injector/matchmakerInjector';
import CompeStateRepository from '@/infrastructure/repository/compeStateRepository';
import ConfigRepository from '@/infrastructure/repository/configRepository';
import CustomJsonResponse from '@/interfaces/response/customJson';
import ImageDirectoryResponse from '@/interfaces/response/imageDirectory';

const router = express.Router();
expressWs(router);

const matchmakerInjector = new MatchmakerInjector();
const matchmakerController = matchmakerInjector.getMatchmakerController();
const config = new ConfigRepository(new OsEnvironmentVariablesReader());
const compeStateRepository = new CompeStateRepository();

router.use(cors());

router.get(
  '/api/v1/matchmaker/image/:teamId',
  (req: Request, res: Response<Buffer>): void => {
    const ip: string = Object.prototype.hasOwnProperty.call(
      req.headers,
      'x-forwarded-for',
    )
      ? (req.headers['x-forwarded-for'] as string)
      : req.ip!;
    if (
      ip !== config.find().matchmakerIp &&
      compeStateRepository.find().state !== STATE.UNDEFINED
    ) {
      throw new CustomError(403, 'Request not currently allowed');
    }
    return matchmakerController.getImageHandle(req, res);
  },
);

router.get(
  '/api/v1/matchmaker/image-paths',
  (req: Request, res: Response<ImageDirectoryResponse>): void => {
    const ip: string = Object.prototype.hasOwnProperty.call(
      req.headers,
      'x-forwarded-for',
    )
      ? (req.headers['x-forwarded-for'] as string)
      : req.ip!;
    if (
      ip !== config.find().matchmakerIp &&
      compeStateRepository.find().state !== STATE.UNDEFINED
    ) {
      throw new CustomError(403, 'Request not currently allowed');
    }
    return matchmakerController.getImageFullPathListHandle(req, res);
  },
);

router.get(
  '/matchmaker/image/:teamId',
  async (req: Request, res: Response<Buffer>) => {
    const ip: string = Object.prototype.hasOwnProperty.call(
      req.headers,
      'x-forwarded-for',
    )
      ? (req.headers['x-forwarded-for'] as string)
      : req.ip!;
    if (
      ip !== config.find().matchmakerIp &&
      compeStateRepository.find().state !== STATE.UNDEFINED
    ) {
      throw new CustomError(403, 'Request not currently allowed');
    }
    return matchmakerController.getImageArchiveHandle(req, res);
  },
);

router.put(
  '/matchmaker/state/:compeState',
  (req: Request, res: Response<CustomJsonResponse>): void => {
    const ip: string = Object.prototype.hasOwnProperty.call(
      req.headers,
      'x-forwarded-for',
    )
      ? (req.headers['x-forwarded-for'] as string)
      : req.ip!;
    if (
      ip !== config.find().matchmakerIp &&
      compeStateRepository.find().state !== STATE.UNDEFINED
    ) {
      throw new CustomError(403, 'Request not currently allowed');
    }
    return matchmakerController.setCompeStateHandle(req, res);
  },
);

router.ws('/api/v1/ws/image-paths', (ws: ws, req: Request) => {
  const intervalId = setInterval(() => {
    matchmakerController.getImageFullPathListWsHandle(ws, req);
  }, 5000);

  ws.on('close', () => {
    clearInterval(intervalId);
  });
});

export default router;
