import { library, build } from '@pokemon/build';

await build(
  library({
    external: ['debug', 'chalk', 'node-emoji']
  })
);
