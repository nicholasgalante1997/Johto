Bun.build({
  entrypoints: ['lib/index.ts'],
  outdir: './dist',
  naming: {
    entry: 'lib.js'
  },
  target: 'bun',
  format: 'esm',
  splitting: false, // Change to true to enable splitting
  sourcemap: 'linked',
  minify: false, // Change to true to make the code fucking unreadable for almost no performance boost
  root: './lib',
  packages: 'external',
});