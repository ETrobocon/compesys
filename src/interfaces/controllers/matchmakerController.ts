import { Request, Response } from 'express';
import ws from 'ws';

import { IGetImageArchiveUsecases } from '@/application/usecases/getImageArchiveUseCase';
import { IGetImageDirectoryListUsecases } from '@/application/usecases/getImageDirectoryListUsecases';
import { IGetImageUsecases } from '@/application/usecases/getImageUsecases';
import { ISetCompeStateUseCases } from '@/application/usecases/setCompeStateUseCase';
import { STATE } from '@/constants';
import { CustomError } from '@/custom-error';
import CustomJsonResponse from '@/interfaces/response/customJson';
import ImageDirectoryResponse from '@/interfaces/response/imageDirectory';

export interface IMatchmakerController {
  getImageHandle(req: Request, res: Response<Buffer>): void;
  getImageFullPathListHandle(
    req: Request,
    res: Response<ImageDirectoryResponse>,
  ): void;
  setCompeStateHandle(req: Request, res: Response<CustomJsonResponse>): void;
  getImageArchiveHandle(req: Request, res: Response<Buffer>): Promise<void>;
  getImageFullPathListWsHandle(ws: ws): void;
}

export default class MatchmakerController implements IMatchmakerController {
  public constructor(
    private readonly getImageUseCase: IGetImageUsecases,
    private readonly getImageDirectoryListUseCase: IGetImageDirectoryListUsecases,
    private readonly setCompeStateUseCase: ISetCompeStateUseCases,
    private readonly getImageArchiveUseCase: IGetImageArchiveUsecases,
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

  public setCompeStateHandle(
    req: Request,
    res: Response<CustomJsonResponse>,
  ): void {
    if (!this.isSTATE(req.params.compeState)) {
      throw new CustomError(400, 'Invalid state format');
    }
    const compeState: STATE = req.params.compeState;
    const result: CustomJsonResponse =
      this.setCompeStateUseCase.execute(compeState);
    res.status(200).send(result);
  }

  private isSTATE(value: string): value is STATE {
    return Object.values(STATE).includes(value as STATE);
  }

  public async getImageArchiveHandle(
    req: Request,
    res: Response<Buffer>,
  ): Promise<void> {
    const teamId = this.parseTeamId(req.params.teamId);

    const archiveFile: Buffer =
      await this.getImageArchiveUseCase.execute(teamId);

    res.header('Content-Type', 'application/zip;');
    res.header(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${teamId}.zip`,
    );
    res.status(200).send(archiveFile);
  }

  public getImageFullPathListWsHandle(ws: ws): void {
    const response: ImageDirectoryResponse =
      this.getImageDirectoryListUseCase.execute();
    ws.send(JSON.stringify(response));
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
