import express, { Request, Response } from 'express';

import VersionInjector from '@/infrastructure/injector/versionInjector';
import VersionResponse from '@/interfaces/response/version';

const router = express.Router();
const versionInjector = new VersionInjector();
const versionController = versionInjector.getVersionController();

router.get('/version', (req: Request, res: Response<VersionResponse>) => {
  versionController.handle(req, res);
});

export default router;
