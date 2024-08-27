import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

import ImageGateway from '@/domain/gateways/imageGateway';
import FileInfo from '@/domain/models/fileInfo';

export default class ImageRepository implements ImageGateway {
  private readonly EEXIST = 'EEXIST';
  private readonly ENOENT = 'ENOENT';
  private readonly TRY_COUNTS = 10;

  public constructor(private readonly TEMP_DIR: string) {}

  public getImageFile(teamId: number, imageFileName: string): Buffer {
    return fs.readFileSync(
      path.join(this.TEMP_DIR, teamId.toString(), imageFileName),
    );
  }

  public getImageArchive(teamId: number): Promise<Buffer> {
    const zipPath = `${this.TEMP_DIR}/${teamId}.zip`;
    const targetDirectory = `${this.TEMP_DIR}/${teamId}`;

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        fs.readFile(zipPath, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      archive.glob('**/*.jpeg', { cwd: targetDirectory });

      archive.finalize();
    });
  }

  public listFiles(teamId: number): FileInfo[] {
    try {
      const files = fs.readdirSync(path.join(this.TEMP_DIR, teamId.toString()));
      const imageFiles = files.filter((file) =>
        ['.jpeg'].some((ext) => file.endsWith(ext)),
      );
      const fileDetails: FileInfo[] = [];
      for (const file of imageFiles) {
        const filePath = path.join(this.TEMP_DIR, teamId.toString(), file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isFile()) {
          const fileInfo: FileInfo = new FileInfo(
            file,
            filePath,
            fileStat.mode,
            fileStat.size,
            fileStat.mtime,
          );
          fileDetails.push(fileInfo);
        }
      }
      return fileDetails;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === this.ENOENT) {
        return [];
      }
      throw err;
    }
  }

  public listTeamId(): string[] {
    return fs
      .readdirSync(path.join(this.TEMP_DIR), { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  public save(imageData: Buffer, teamId: number): void {
    const targetDir = path.join(this.TEMP_DIR, teamId.toString());
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';

    targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      try {
        if (!fs.existsSync(curDir)) {
          fs.mkdirSync(curDir);
        }
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code !== this.EEXIST) {
          throw err;
        }
      }
      return curDir;
    }, initDir);

    let imagePath = '';
    for (let i = 0; i < this.TRY_COUNTS; i++) {
      const now = new Date();
      const date =
        now.getFullYear() +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        ('0' + now.getDate()).slice(-2) +
        ('0' + now.getHours()).slice(-2) +
        ('0' + now.getMinutes()).slice(-2) +
        ('0' + now.getSeconds()).slice(-2) +
        ('0' + now.getMilliseconds()).slice(-3);
      imagePath = path.join(targetDir, `${teamId}_${date}.jpeg`);

      try {
        fs.writeFileSync(imagePath, imageData, {
          flag: 'wx',
        });
        break;
      } catch (err: unknown) {
        if (
          (err as NodeJS.ErrnoException).code !== this.EEXIST ||
          i === this.TRY_COUNTS - 1
        ) {
          throw err;
        }
      }
    }
  }
}
