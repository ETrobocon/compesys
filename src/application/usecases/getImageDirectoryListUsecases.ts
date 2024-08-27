import ImageGateway from '@/domain/gateways/imageGateway';
import ImageDirectoryResponse from '@/interfaces/response/imageDirectory';

export interface IGetImageDirectoryListUsecases {
  execute(): ImageDirectoryResponse;
}

export default class GetImageDirectoryListUsecases
  implements IGetImageDirectoryListUsecases
{
  public constructor(private readonly imageGateway: ImageGateway) {}

  public execute(): ImageDirectoryResponse {
    const response = this.imageGateway.listTeamId();

    const teamIdUnitFileList = response.map((teamId: string) => {
      const fileList = this.imageGateway.listFiles(Number(teamId));
      return {
        teamId: Number(teamId),
        fileList: fileList.map((fileInfo) => {
          return { name: fileInfo.name, size: fileInfo.size };
        }),
      };
    });

    return {
      teamIdUnitFileList: teamIdUnitFileList,
    };
  }
}
