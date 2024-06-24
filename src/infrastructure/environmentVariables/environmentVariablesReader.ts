export default interface EnvironmentVariablesReader {
  load(key: string): string | undefined;
}
