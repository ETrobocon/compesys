export interface IConfig {
  readonly listenPort: string;
  readonly tempDir: string;
  readonly matchmakerIp: string;
}

export default class Config implements IConfig {
  private _listenPort: string;
  private _tempDir: string;
  private _matchmakerIp: string;

  public constructor(
    listenPort: string,
    tempDir: string,
    matchmakerIp: string,
  ) {
    this._listenPort = listenPort;
    this._tempDir = tempDir;
    this._matchmakerIp = matchmakerIp;
  }

  public get listenPort(): string {
    return this._listenPort;
  }

  public get tempDir(): string {
    return this._tempDir;
  }

  public get matchmakerIp(): string {
    return this._matchmakerIp;
  }
}
