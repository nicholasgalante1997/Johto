import { server, build } from '@pokemon/build';

await build(
  server({
    splitting: true,
    naming: { entry: 'main.js' }
  })
);
