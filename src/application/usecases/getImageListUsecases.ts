import { CustomError } from '@/custom-error';
import ImageGateway from '@/domain/gateways/imageGateway';
import FileInfo from '@/domain/models/fileInfo';
import ImageListResponse from '@/interfaces/response/imageList';

export interface IGetImageListUsecases {
  execute(teamId: number): ImageListResponse;
}

export default class GetImageListUsecases implements IGetImageListUsecases {
  public constructor(private readonly imageGateway: ImageGateway) {}

  public execute(teamId: number): ImageListResponse {
    this.validateTeamId(teamId);

    const response: FileInfo[] = this.imageGateway.listFiles(teamId);

    const imageListResponse: ImageListResponse = {
      files: response.map((fileInfo) => {
        return { name: fileInfo.name, size: fileInfo.size };
      }),
    };
    return imageListResponse;
  }

  private validateTeamId(teamId: number): void {
    if (!(teamId >= 1 && teamId <= 300)) {
      throw new CustomError(400, 'Invalid id format or range');
    }
  }
}
