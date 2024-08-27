export interface IFileInfo {
  readonly name: string;
  readonly path: string;
  readonly mode: number;
  readonly size: number;
  readonly mtime: Date;
}

export default class FileInfo implements IFileInfo {
  private _name: string;
  private _path: string;
  private _mode: number;
  private _size: number;
  private _mtime: Date;

  public constructor(
    name: string,
    path: string,
    mode: number,
    size: number,
    mtime: Date,
  ) {
    this._name = name;
    this._path = path;
    this._mode = mode;
    this._size = size;
    this._mtime = mtime;
  }

  public get name(): string {
    return this._name;
  }

  public get path(): string {
    return this._path;
  }

  public get mode(): number {
    return this._mode;
  }

  public get size(): number {
    return this._size;
  }

  public get mtime(): Date {
    return this._mtime;
  }
}
