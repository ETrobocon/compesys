import { STATE } from '@/constants';
import CompeStateGateway from '@/domain/gateways/compeStateGateway';
import CustomJsonResponse from '@/interfaces/response/customJson';
import { archiveTempTeamDirectory } from '@/util';

export interface ISetCompeStateUseCases {
  execute(compeState: STATE): Promise<CustomJsonResponse>;
}

export default class SetCompeStateUseCases implements ISetCompeStateUseCases {
  public constructor(private readonly compeStateGateway: CompeStateGateway) {}

  public async execute(compeState: STATE): Promise<CustomJsonResponse> {
    switch (compeState) {
      case STATE.UNDEFINED:
      case STATE.READY:
        await archiveTempTeamDirectory();
    }

    this.compeStateGateway.save(compeState);

    return { status: 'OK' };
  }
}
