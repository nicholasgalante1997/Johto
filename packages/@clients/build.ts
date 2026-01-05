Bun.build({
  entrypoints: ['lib/index.ts'],
  format: 'esm',
  minify: false,
  target: 'bun',
  outdir: './out',
  splitting: false,
  packages: 'external',
  sourcemap: 'linked'
});
