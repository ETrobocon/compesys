import { Request, Response } from 'express';

import { IGetImageDirectoryListUsecases } from '@/application/usecases/getImageDirectoryListUsecases';
import { IGetImageUsecases } from '@/application/usecases/getImageUsecases';
import { CustomError } from '@/custom-error';
import ImageDirectoryResponse from '@/interfaces/response/imageDirectory';

export interface IMatchmakerController {
  getImageHandle(req: Request, res: Response<Buffer>): void;
  getImageFullPathListHandle(
    req: Request,
    res: Response<ImageDirectoryResponse>,
  ): void;
}

export default class MatchmakerController implements IMatchmakerController {
  public constructor(
    private readonly getImageUseCase: IGetImageUsecases,
    private readonly getImageDirectoryListUseCase: IGetImageDirectoryListUsecases,
  ) {}
  public getImageHandle(req: Request, res: Response<Buffer>): void {
    const teamId = this.parseTeamId(req.params.teamId);
    const imageFileName: string = req.query.name as string;

    const imageFile: Buffer = this.getImageUseCase.execute(
      teamId,
      imageFileName,
    );

    res.header('Content-Type', 'image/jpeg;');
    res.status(200).send(imageFile);
  }

  public getImageFullPathListHandle(
    req: Request,
    res: Response<ImageDirectoryResponse>,
  ): void {
    const response: ImageDirectoryResponse =
      this.getImageDirectoryListUseCase.execute();
    res.status(200).send(response);
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
}
