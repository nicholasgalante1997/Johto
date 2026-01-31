import type { BuildConfig, BuildOutput } from 'bun';
import path from 'path';

export async function build(config: BuildConfig): Promise<BuildOutput> {
  const start = performance.now();
  try {
    const output = await Bun.build({ ...config, metafile: true });
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`✅ Build succeeded in ${elapsed} ms`);
    await writeMetafile(output);
    return output;
  } catch (error) {
    const elapsed = (performance.now() - start).toFixed(2);
    console.error(`❌ Build failed after ${elapsed} ms`);
    throw error;
  }
}

export async function concurrent_build(
  ...configs: BuildConfig[]
): Promise<BuildOutput[]> {
  const start = performance.now();
  try {
    const outputs = await Promise.all(
      configs.map((config) => Bun.build({ ...config, metafile: true }))
    );
    await Promise.all(outputs.map((output) => writeMetafile(output)));
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`✅ Build succeeded in ${elapsed} ms`);
    return outputs;
  } catch (error) {
    const elapsed = (performance.now() - start).toFixed(2);
    console.error(`❌ Build failed after ${elapsed} ms`);
    throw error;
  }
}

async function writeMetafile(output: BuildOutput): Promise<number> {
  if (output.metafile) {
    const outpath = output.outputs[0]?.path;
    if (!outpath) {
      throw new Error('No output path found in build output.');
    }
    const outdir = path.dirname(outpath);
    const metafilePath = path.join(outdir, 'metafile.json');
    return Bun.write(metafilePath, JSON.stringify(output.metafile, null, 2));
  }
  return -1;
}
