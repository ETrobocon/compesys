import { STATE } from '@/constants';
import CompeState from '@/domain/models/compeState';

export default interface CompeStateGateway {
  find(): CompeState;
  save(state: STATE): void;
}
