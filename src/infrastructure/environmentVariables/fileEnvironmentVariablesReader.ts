import dotenv from 'dotenv';

import EnvironmentVariablesReader from '@/infrastructure/environmentVariables/environmentVariablesReader';

export default class FileEnvironmentVariablesReader
  implements EnvironmentVariablesReader
{
  private readonly filePath: string;
  private readonly envMap: Map<string, string>;

  constructor(filePath: string) {
    this.filePath = filePath;
    dotenv.config({ path: this.filePath });
    this.envMap = new Map<string, string>();
    for (const key in process.env) {
      if (
        Object.prototype.hasOwnProperty.call(process.env, key) &&
        process.env[key] !== undefined
      ) {
        this.envMap.set(key, process.env[key] ?? '');
      }
    }
  }

  load(key: string): string | undefined {
    return this.envMap.get(key);
  }
}
