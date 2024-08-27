import GetImageArchiveUsecases from '@/application/usecases/getImageArchiveUseCase';
import GetImageDirectoryListUsecases from '@/application/usecases/getImageDirectoryListUsecases';
import GetImageUsecases from '@/application/usecases/getImageUsecases';
import SetCompeStateUseCase from '@/application/usecases/setCompeStateUseCase';
import OsEnvironmentVariablesReader from '@/infrastructure/environmentVariables/osEnvironmentVariablesReader';
import CompeStateRepository from '@/infrastructure/repository/compeStateRepository';
import ConfigRepository from '@/infrastructure/repository/configRepository';
import ImageRepository from '@/infrastructure/repository/imageRepository';
import MatchmakerController from '@/interfaces/controllers/matchmakerController';

export default class MatchmakerInjector {
  public getMatchmakerController(): MatchmakerController {
    const environmentVariablesReader = new OsEnvironmentVariablesReader();
    const config = new ConfigRepository(environmentVariablesReader);
    const imageRepository = new ImageRepository(config.find().tempDir);
    const compeStateRepository = new CompeStateRepository();
    const getImageUsecase = new GetImageUsecases(imageRepository);
    const getImageDirectoryListUsecase = new GetImageDirectoryListUsecases(
      imageRepository,
    );
    const getImageArchiveUseCase = new GetImageArchiveUsecases(imageRepository);
    const setCompeStateUseCase = new SetCompeStateUseCase(compeStateRepository);
    return new MatchmakerController(
      getImageUsecase,
      getImageDirectoryListUsecase,
      setCompeStateUseCase,
      getImageArchiveUseCase,
    );
  }
}
