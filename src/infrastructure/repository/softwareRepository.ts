import SoftwareGateway from '@/domain/gateways/softwareGateway';
import Software from '@/domain/models/software';
import { SOFTWARE } from '@/infrastructure/environmentVariables/const';
import EnvironmentVariablesReader from '@/infrastructure/environmentVariables/environmentVariablesReader';

export default class SoftwareRepository implements SoftwareGateway {
  public constructor(
    private readonly environmentVariablesReader: EnvironmentVariablesReader,
  ) {}

  public find(): Software {
    return new Software(
      this.environmentVariablesReader.load(SOFTWARE.NAME) ?? '',
      this.environmentVariablesReader.load(SOFTWARE.VERSION) ?? '',
    );
  }
}
