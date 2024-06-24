import { CustomError } from '@/custom-error';
import ImageGateway from '@/domain/gateways/imageGateway';
import CustomJsonResponse from '@/interfaces/response/customJson';

export interface ICreateSnapUsecases {
  execute(fileBuffer: Buffer, teamId: number): CustomJsonResponse;
}

export default class CreateSnapUsecases implements ICreateSnapUsecases {
  public constructor(private readonly imageGateway: ImageGateway) {}
  private static readonly JPEG_MAGIC_NUMBER = Buffer.from([0xff, 0xd8]);

  public execute(fileBuffer: Buffer, teamId: number): CustomJsonResponse {
    this.validateTeamId(teamId);
    this.validateMagicNumber(fileBuffer);

    this.imageGateway.save(fileBuffer, teamId);

    return { status: 'Created' };
  }

  private validateTeamId(teamId: number): void {
    if (!(teamId >= 1 && teamId <= 300)) {
      throw new CustomError(400, 'Invalid id format or range');
    }
  }

  private validateMagicNumber(fileBuffer: Buffer): void {
    const fileMagicNumber = Buffer.from(
      fileBuffer.buffer,
      fileBuffer.byteOffset,
      2,
    );
    if (!fileMagicNumber.equals(CreateSnapUsecases.JPEG_MAGIC_NUMBER)) {
      throw new CustomError(400, 'Unexpected magic number');
    }
  }
}
