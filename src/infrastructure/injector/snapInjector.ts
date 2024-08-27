import CreateSnapUsecases from '@/application/usecases/createSnapUsecases';
import GetImageListUsecases from '@/application/usecases/getImageListUsecases';
import OsEnvironmentVariablesReader from '@/infrastructure/environmentVariables/osEnvironmentVariablesReader';
import CompeStateRepository from '@/infrastructure/repository/compeStateRepository';
import ConfigRepository from '@/infrastructure/repository/configRepository';
import ImageRepository from '@/infrastructure/repository/imageRepository';
import SnapController from '@/interfaces/controllers/snapController';

export default class SnapInjector {
  public getSnapController(): SnapController {
    const environmentVariablesReader = new OsEnvironmentVariablesReader();
    const config = new ConfigRepository(environmentVariablesReader);
    const imageRepository = new ImageRepository(config.find().tempDir);
    const compeStateRepository = new CompeStateRepository();
    const createSnapUsecase = new CreateSnapUsecases(
      imageRepository,
      compeStateRepository,
    );
    const getImageListUsecase = new GetImageListUsecases(imageRepository);
    return new SnapController(createSnapUsecase, getImageListUsecase);
  }
}
