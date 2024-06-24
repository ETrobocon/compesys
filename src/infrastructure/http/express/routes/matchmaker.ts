import cors from 'cors';
import express, { Request, Response } from 'express';

import MatchmakerInjector from '@/infrastructure/injector/matchmakerInjector';
import ImageDirectoryResponse from '@/interfaces/response/imageDirectory';

const router = express.Router();
const matchmakerInjector = new MatchmakerInjector();
const matchmakerController = matchmakerInjector.getMatchmakerController();

router.use(cors());

router.get(
  '/api/v1/matchmaker/image/:teamId',
  (req: Request, res: Response<Buffer>): void => {
    return matchmakerController.getImageHandle(req, res);
  },
);

router.get(
  '/api/v1/matchmaker/image-paths',
  (req: Request, res: Response<ImageDirectoryResponse>): void => {
    return matchmakerController.getImageFullPathListHandle(req, res);
  },
);

export default router;
