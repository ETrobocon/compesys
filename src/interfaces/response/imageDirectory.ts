export default interface ImageDirectoryResponse {
  teamIdUnitFileList: TeamIdUnitFileList[];
}

export interface TeamIdUnitFileList {
  teamId: number;
  fileList: FileInfo[];
}

export interface FileInfo {
  name: string;
  size: number;
}
