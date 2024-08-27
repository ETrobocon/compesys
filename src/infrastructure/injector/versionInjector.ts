import GetVersionUsecases from '@/application/usecases/getVersionUsecases';
import OsEnvironmentVariablesReader from '@/infrastructure/environmentVariables/osEnvironmentVariablesReader';
import SoftwareRepository from '@/infrastructure/repository/softwareRepository';
import VersionController from '@/interfaces/controllers/versionController';

export default class VersionInjector {
  public getVersionController(): VersionController {
    const environmentVariablesReader = new OsEnvironmentVariablesReader();
    const repository = new SoftwareRepository(environmentVariablesReader);
    const usecase = new GetVersionUsecases(repository);
    return new VersionController(usecase);
  }
}
