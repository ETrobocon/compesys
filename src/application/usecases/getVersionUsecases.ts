import SoftwareGateway from '@/domain/gateways/softwareGateway';
import Software from '@/domain/models/software';
import VersionResponse from '@/interfaces/response/version';

export interface IGetVersionUsecases {
  execute(): VersionResponse;
}

export default class GetVersionUsecases implements IGetVersionUsecases {
  public constructor(private readonly softwareGateway: SoftwareGateway) {}

  public execute(): VersionResponse {
    const software: Software = this.softwareGateway.find();
    const versionResponse: VersionResponse = {
      compesys: software.version || '',
    };
    return versionResponse;
  }
}
