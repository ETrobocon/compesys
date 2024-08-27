import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

export const archiveTempTeamDirectory = async () => {
  const tempDir = process.env.TEMP_DIR!;
  const directories = fs
    .readdirSync(tempDir)
    .filter((file) => fs.statSync(path.join(tempDir, file)).isDirectory());

  for (const dir of directories) {
    const targetDirectory = path.join(tempDir, dir);
    const zipPath = getUniqueZipPath(dir);
    const jpegFiles = fs
      .readdirSync(targetDirectory)
      .filter((file) => path.extname(file).toLowerCase() === '.jpeg');

    if (jpegFiles.length === 0) continue;

    await createZipArchive(targetDirectory, zipPath);

    jpegFiles.forEach((file) => {
      const filePath = path.join(targetDirectory, file);
      fs.unlinkSync(filePath);
    });
  }
};

const getUniqueZipPath = (dir: string): string => {
  let zipPath: string;
  let counter = 0;

  do {
    const counterStr = counter.toString().padStart(4, '0');
    zipPath = path.join(process.env.TEMP_DIR!, dir, `${dir}_${counterStr}.zip`);
    counter++;
  } while (fs.existsSync(zipPath) && counter <= 9999);

  if (counter > 9999) {
    throw new Error('No unique zip file name could be generated.');
  }

  return zipPath;
};

const createZipArchive = (
  sourceDir: string,
  zipPath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.glob('**/*.jpeg', { cwd: sourceDir });
    archive.finalize();
  });
};
