export interface ISoftware {
  readonly name: string;
  readonly version: string;
}

export default class Software implements ISoftware {
  private _name: string;
  private _version: string;

  public constructor(name: string, version: string) {
    this._name = name;
    this._version = version;
  }

  public get name(): string {
    return this._name;
  }

  public get version(): string {
    return this._version;
  }
}
