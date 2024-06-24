import { CustomError } from '@/custom-error';
import ImageGateway from '@/domain/gateways/imageGateway';

export interface IGetImageUsecases {
  execute(teamId: number, imageFileName: string): Buffer;
}

export default class GetImageUsecases implements IGetImageUsecases {
  public constructor(private readonly imageGateway: ImageGateway) {}

  public execute(teamId: number, imageFileName: string): Buffer {
    this.validateTeamId(teamId);

    const response: Buffer = this.imageGateway.getImageFile(
      teamId,
      imageFileName,
    );

    return response;
  }

  private validateTeamId(teamId: number): void {
    if (!(teamId >= 1 && teamId <= 300)) {
      throw new CustomError(400, 'Invalid id format or range');
    }
  }
}
