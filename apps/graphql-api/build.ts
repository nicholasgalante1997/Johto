export {};

try {
  await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    naming: {
      entry: 'main.js'
    },
    target: 'bun',
    format: 'esm',
    splitting: true,
    packages: 'external',
    env: 'inline',
    sourcemap: 'linked',
    minify: false,
    root: '.'
  });
} catch (e) {
  console.error('Build failed:', e);
  process.exit(1);
}

console.log('Build complete');