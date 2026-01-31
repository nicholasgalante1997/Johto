import type { BuildOutput } from 'bun';
import bytes from 'bytes';
import { get } from 'node-emoji';

export function report_outputs(outputs: BuildOutput[]): void {
  for (let output of outputs) {
    if (!output.success) {
      console.error('❌ Build failed with errors:');
      for (let message of output.logs) {
        console.error(message);
      }
      continue;
    }

    const { logs, outputs: outfiles } = output;

    for (let message of logs) {
      console.log(message);
    }

    console.log(`${get('package')} Created outputs:`);
    for (let outfile of outfiles) {
      console.log(` - ${outfile.path}`);
      console.log(`   - Size: ${bytes(outfile.size)}`);
    }

    if (output.metafile) {
      console.log(`${get('paperclip')} Metafile written`);
    }
  }
}
