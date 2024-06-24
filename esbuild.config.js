import * as esbuild from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';
import * as path from 'path';
import { fileURLToPath } from 'url';

await esbuild
  .build({
    entryPoints: [
      {
        in: 'src/app.ts',
        out: 'app',
      },
      {
        in: 'src/logTransport.ts',
        out: 'logTransport',
      },
    ],
    bundle: true,
    platform: 'node',
    target: 'node16',
    outdir: 'dist',
    format: 'esm',
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
    },
    banner: {
      js: 'import { createRequire } from "module"; import url from "url"; const require = createRequire(import.meta.url); const __filename = url.fileURLToPath(import.meta.url); const __dirname = url.fileURLToPath(new URL(".", import.meta.url));',
    },
    minify: true,
    external: ['fs'],
    plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
  })
  .catch(() => process.exit(1));
