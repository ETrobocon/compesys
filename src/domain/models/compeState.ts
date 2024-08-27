import { STATE } from '@/constants';

export interface ICompeState {
  readonly state: STATE;
}

export default class CompeState implements ICompeState {
  private _state: STATE;

  public constructor(state: STATE) {
    this._state = state;
  }

  public get state(): STATE {
    return this._state;
  }

  public set state(state: STATE) {
    this._state = state;
  }
}
