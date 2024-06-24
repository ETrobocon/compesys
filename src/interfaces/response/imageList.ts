export default interface SnapListResponse {
  files: FileInfo[];
}

interface FileInfo {
  name: string;
  size: number;
}
