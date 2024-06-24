import express, { Request, Response } from 'express';

import SnapInjector from '@/infrastructure/injector/snapInjector';
import CustomJsonResponse from '@/interfaces/response/customJson';
import ImageListResponse from '@/interfaces/response/imageList';

const router = express.Router();
const snapInjector = new SnapInjector();
const snapController = snapInjector.getSnapController();

router.post(
  '/snap',
  express.raw({ type: 'image/jpeg', limit: '10mb' }),
  (
    req: Request<unknown, CustomJsonResponse, Buffer>,
    res: Response<CustomJsonResponse>,
  ): void => {
    return snapController.createSnapHandle(req, res);
  },
);

router.get(
  '/snap/list',
  (req: Request, res: Response<ImageListResponse>): void => {
    return snapController.getListHandle(req, res);
  },
);

export default router;
