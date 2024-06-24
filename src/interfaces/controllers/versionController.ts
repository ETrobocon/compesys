import { Request, Response } from 'express';

import { IGetVersionUsecases } from '@/application/usecases/getVersionUsecases';
import VersionResponse from '@/interfaces/response/version';

export interface IVersionController {
  handle(req: Request, res: Response<VersionResponse>): void;
}

export default class VersionController implements IVersionController {
  public constructor(private readonly getVersionUseCase: IGetVersionUsecases) {}

  public handle(req: Request, res: Response<VersionResponse>): void {
    const response: VersionResponse = this.getVersionUseCase.execute();
    res.status(200).json(response);
  }
}
