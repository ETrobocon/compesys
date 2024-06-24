import ConfigGateway from '@/domain/gateways/configGateway';
import Config from '@/domain/models/config';
import { CONFIG } from '@/infrastructure/environmentVariables/const';
import EnvironmentVariablesReader from '@/infrastructure/environmentVariables/environmentVariablesReader';

export default class ConfigRepository implements ConfigGateway {
  public constructor(
    private readonly environmentVariablesReader: EnvironmentVariablesReader,
  ) {}

  public find(): Config {
    return new Config(
      this.environmentVariablesReader.load(CONFIG.LISTEN_PORT) ?? '',
      this.environmentVariablesReader.load(CONFIG.TEMP_DIR) ?? '',
    );
  }
}
