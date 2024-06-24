import CreateSnapUsecases from '@/application/usecases/createSnapUsecases';
import GetImageListUsecases from '@/application/usecases/getImageListUsecases';
import OsEnvironmentVariablesReader from '@/infrastructure/environmentVariables/osEnvironmentVariablesReader';
import ConfigRepository from '@/infrastructure/repository/configRepository';
import ImageRepository from '@/infrastructure/repository/imageRepository';
import SnapController from '@/interfaces/controllers/snapController';

export default class SnapInjector {
  public getSnapController(): SnapController {
    const environmentVariablesReader = new OsEnvironmentVariablesReader();
    const config = new ConfigRepository(environmentVariablesReader);
    const repository = new ImageRepository(config.find().tempDir);
    const createSnapUsecase = new CreateSnapUsecases(repository);
    const getImageListUsecase = new GetImageListUsecases(repository);
    return new SnapController(createSnapUsecase, getImageListUsecase);
  }
}
