await Bun.build({
  entrypoints: ['src/web/browser/index.tsx'],
  jsx: {
    runtime: 'automatic',
    importSource: 'react'
  },
  outdir: './out',
  naming: {
    entry: 'www/browser.[hash].js'
  },
  target: 'browser',
  format: 'esm',
  packages: 'bundle',
  splitting: false, // Change to true to enable splitting
  sourcemap: 'linked',
  minify: false, // Change to true to make the code fucking unreadable for almost no performance boost
  root: '.'
});
