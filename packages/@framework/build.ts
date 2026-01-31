import { library, build } from '@pokemon/build';

await build(
  library({
    outdir: './dist',
    root: './lib',
    naming: { entry: 'lib.js' }
  })
);
