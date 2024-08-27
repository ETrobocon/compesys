import { Request, Response } from 'express';

import { ICreateSnapUsecases } from '@/application/usecases/createSnapUsecases';
import { IGetImageListUsecases } from '@/application/usecases/getImageListUsecases';
import { CustomError } from '@/custom-error';
import CustomJsonResponse from '@/interfaces/response/customJson';
import ImageListResponse from '@/interfaces/response/imageList';

export interface ISnapController {
  createSnapHandle(
    req: Request<unknown, CustomJsonResponse, Buffer>,
    res: Response<CustomJsonResponse>,
  ): void;
  getListHandle(req: Request, res: Response<ImageListResponse>): void;
}

export default class SnapController implements ISnapController {
  public constructor(
    private readonly createSnapUseCase: ICreateSnapUsecases,
    private readonly getImageListUseCase: IGetImageListUsecases,
  ) {}

  public createSnapHandle(
    req: Request<unknown, CustomJsonResponse, Buffer>,
    res: Response<CustomJsonResponse>,
  ): void {
    this.validateContentType(req as Request);
    const teamId = this.parseTeamId(
      req.query.id as string | string[] | undefined,
    );

    const snap: CustomJsonResponse = this.createSnapUseCase.execute(
      req.body,
      teamId,
    );
    res.status(201).json(snap);
  }

  public getListHandle(req: Request, res: Response<ImageListResponse>): void {
    const teamId = this.parseTeamId(
      req.query.id as string | string[] | undefined,
    );

    const response: ImageListResponse =
      this.getImageListUseCase.execute(teamId);
    res.json(response);
  }

  private parseTeamId(id: string | string[] | undefined): number {
    if (typeof id !== 'string') {
      throw new CustomError(400, 'Invalid id format or range');
    }
    const teamId = parseInt(id, 10);
    if (isNaN(teamId) || !Number.isInteger(teamId)) {
      throw new CustomError(400, 'Invalid id format or range');
    }
    return teamId;
  }

  private validateContentType(req: Request): void {
    if (req.get('Content-Type') !== 'image/jpeg') {
      throw new CustomError(400, 'Unexpected content type');
    }
  }
}
