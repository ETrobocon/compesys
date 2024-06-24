import GetImageDirectoryListUsecases from '@/application/usecases/getImageDirectoryListUsecases';
import GetImageUsecases from '@/application/usecases/getImageUsecases';
import OsEnvironmentVariablesReader from '@/infrastructure/environmentVariables/osEnvironmentVariablesReader';
import ConfigRepository from '@/infrastructure/repository/configRepository';
import ImageRepository from '@/infrastructure/repository/imageRepository';
import MatchmakerController from '@/interfaces/controllers/matchmakerController';

export default class MatchmakerInjector {
  public getMatchmakerController(): MatchmakerController {
    const environmentVariablesReader = new OsEnvironmentVariablesReader();
    const config = new ConfigRepository(environmentVariablesReader);
    const repository = new ImageRepository(config.find().tempDir);
    const getImageUsecase = new GetImageUsecases(repository);
    const getImageDirectoryListUsecase = new GetImageDirectoryListUsecases(
      repository,
    );
    return new MatchmakerController(
      getImageUsecase,
      getImageDirectoryListUsecase,
    );
  }
}
