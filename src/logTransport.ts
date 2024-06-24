import { once } from 'events';
import build from 'pino-abstract-transport';
import PinoPretty from 'pino-pretty';
import SonicBoom from 'sonic-boom';
import { PassThrough } from 'stream';

interface CustomTransportOptions {
  prettyOptions: PinoPretty.PrettyOptions;
  filePath: string;
  mkdir: boolean;
}

export default async (options: CustomTransportOptions) => {
  const fileStream = new SonicBoom({
    dest: options.filePath,
    mkdir: options.mkdir,
  });

  const passThrough = new PassThrough();
  const prettyStream = PinoPretty(options.prettyOptions);
  passThrough.pipe(prettyStream);
  await once(fileStream, 'ready');

  return build(
    async function (source) {
      for await (const obj of source) {
        const toDrain = !fileStream.write(JSON.stringify(obj) + '\n');
        const line = JSON.stringify(obj) + '\n';
        passThrough.write(line);
        if (toDrain) {
          await once(fileStream, 'drain');
        }
      }
    },
    {
      async close() {
        passThrough.end();
        fileStream.end();
        await once(fileStream, 'close');
      },
    },
  );
};
