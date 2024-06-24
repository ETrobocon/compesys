import FileInfo from '@/domain/models/fileInfo';

export default interface ImageGateway {
  getImageFile(teamId: number, imageFileName: string): Buffer;
  listFiles(teamId: number): FileInfo[];
  listTeamId(): string[];
  save(imageData: Buffer, teamId: number): void;
}
