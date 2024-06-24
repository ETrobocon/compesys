import Software from '@/domain/models/software';

export default interface SoftwareGateway {
  find(): Software;
}
