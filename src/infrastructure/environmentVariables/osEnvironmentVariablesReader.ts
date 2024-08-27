import dotenv from 'dotenv';

import EnvironmentVariablesReader from '@/infrastructure/environmentVariables/environmentVariablesReader';

export default class OsEnvironmentVariablesReader
  implements EnvironmentVariablesReader
{
  constructor() {
    dotenv.config();
  }

  load(key: string): string | undefined {
    const value = process.env[key];
    return value;
  }
}
