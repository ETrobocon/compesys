import { CustomError } from '@/custom-error';
import ImageGateway from '@/domain/gateways/imageGateway';

export interface IGetImageArchiveUsecases {
  execute(teamId: number): Promise<Buffer>;
}

export default class GetImageArchiveUsecases
  implements IGetImageArchiveUsecases
{
  public constructor(private readonly imageGateway: ImageGateway) {}

  public execute(teamId: number): Promise<Buffer> {
    if (!this.validateTeamId(teamId)) {
      throw new CustomError(400, 'Invalid id format or range');
    }

    return this.imageGateway.getImageArchive(teamId);
  }

  private validateTeamId(teamId: number): boolean {
    if (!(teamId >= 1 && teamId <= 300)) {
      return false;
    }
    return true;
  }
}
