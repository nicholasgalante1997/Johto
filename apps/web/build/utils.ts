import type { BuildConfig, BuildOutput } from 'bun';
import bytes from 'bytes';
import { get } from 'node-emoji';
import path from 'path';

export async function concurrent_build(...configs: BuildConfig[]) {
  let error = null,
    outputs: BuildOutput[] = [],
    start = performance.now(),
    builds = configs.map((config) => Bun.build({ ...config, metafile: true }));

  try {
    outputs = await Promise.all(builds);
    await Promise.all(writeOutputMetadata(outputs));
  } catch (_error) {
    error = _error;
  } finally {
    let end = performance.now();
    let time = end - start;
    if (error) {
      console.error(`❌ Build failed after ${time.toFixed(2)} ms`);
      throw error;
    } else {
      console.log(`✅ Build succeeded in ${time.toFixed(2)} ms`);
      return outputs;
    }
  }
}

export function report_outputs(outputs: BuildOutput[]) {
  for (let output of outputs) {
    if (!output.success) {
      console.error('❌ Build failed with errors:');
      for (let message of output.logs) {
        console.error(message);
      }

      continue;
    }

    const { logs, outputs, metafile } = output;

    for (let message of logs) {
      console.log(message);
    }

    console.log(`${get('package')} Created outputs:`);
    for (let outfile of outputs) {
      console.log(` - ${outfile.path}`);
      console.log(`   - Size: ${bytes(outfile.size)}`);
    }

    console.log(`${get('paperclip')} Metafile outputs:`);
  }
}

function writeOutputMetadata(outputs: BuildOutput[]) {
  return outputs.map((output) => {
    if (output.metafile) {
      const { outputs } = output;
      const outpath = outputs[0]?.path;

      if (!outpath) {
        throw new Error('No output path found in build output.');
      }

      const outdir = path.dirname(outpath);
      const metafilePath = path.join(outdir, 'metafile.json');

      return Bun.write(metafilePath, JSON.stringify(output.metafile, null, 2));
    }

    return Promise.resolve(-1);
  });
}
