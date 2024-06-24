export interface IConfig {
  readonly listenPort: string;
  readonly tempDir: string;
}

export default class Config implements IConfig {
  private _listenPort: string;
  private _tempDir: string;

  public constructor(listenPort: string, tempDir: string) {
    this._listenPort = listenPort;
    this._tempDir = tempDir;
  }

  public get listenPort(): string {
    return this._listenPort;
  }

  public get tempDir(): string {
    return this._tempDir;
  }
}
