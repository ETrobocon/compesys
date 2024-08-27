import Config from '@/domain/models/config';

export default interface ConfigGateway {
  find(): Config;
}
