import { STATE } from '@/constants';
import CompeStateGateway from '@/domain/gateways/compeStateGateway';
import CompeState from '@/domain/models/compeState';

export default class CompeStateRepository implements CompeStateGateway {
  private static compeState: CompeState = new CompeState(STATE.UNDEFINED);

  public find(): CompeState {
    return CompeStateRepository.compeState;
  }

  public save(state: STATE): void {
    CompeStateRepository.compeState.state = state;
  }
}
