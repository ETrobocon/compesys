import { STATE } from '@/constants';
import { CustomError } from '@/custom-error';
import CompeStateGateway from '@/domain/gateways/compeStateGateway';
import ImageGateway from '@/domain/gateways/imageGateway';
import CustomJsonResponse from '@/interfaces/response/customJson';

export interface ICreateSnapUsecases {
  execute(fileBuffer: Buffer, teamId: number): CustomJsonResponse;
}

export default class CreateSnapUsecases implements ICreateSnapUsecases {
  public constructor(
    private readonly imageGateway: ImageGateway,
    private readonly compeStateGateway: CompeStateGateway,
  ) {}
  private static readonly JPEG_MAGIC_NUMBER = Buffer.from([0xff, 0xd8]);

  public execute(fileBuffer: Buffer, teamId: number): CustomJsonResponse {
    if (!this.validateTeamId(teamId)) {
      throw new CustomError(400, 'Invalid id format or range');
    }
    if (!this.validateMagicNumber(fileBuffer)) {
      throw new CustomError(400, 'Unexpected magic number');
    }
    if (
      this.compeStateGateway.find().state === STATE.READY ||
      this.compeStateGateway.find().state === STATE.GOAL
    ) {
      throw new CustomError(403, 'Request not currently allowed');
    }
    if (
      this.compeStateGateway.find().state !== STATE.UNDEFINED &&
      this.imageGateway.listFiles(teamId).length >= 2
    ) {
      throw new CustomError(429, 'Up to 2 images can be accepted');
    }
    this.imageGateway.save(fileBuffer, teamId);

    return { status: 'Created' };
  }

  private validateTeamId(teamId: number): boolean {
    if (!(teamId >= 1 && teamId <= 300)) {
      return false;
    }
    return true;
  }

  private validateMagicNumber(fileBuffer: Buffer): boolean {
    if (fileBuffer.byteLength === undefined) {
      return false;
    }
    if (fileBuffer.byteOffset === undefined) {
      return false;
    }
    if (fileBuffer.byteLength - fileBuffer.byteOffset < 2) {
      return false;
    }
    const fileMagicNumber = Buffer.from(
      fileBuffer.buffer,
      fileBuffer.byteOffset,
      2,
    );
    if (!fileMagicNumber.equals(CreateSnapUsecases.JPEG_MAGIC_NUMBER)) {
      return false;
    }
    return true;
  }
}
