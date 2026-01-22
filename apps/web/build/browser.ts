import type { BuildConfig } from 'bun';

const _: BuildConfig = {
  entrypoints: ['src/web/browser/browser.tsx'],
  jsx: {
    runtime: 'automatic',
    importSource: 'react'
  },
  outdir: './out',
  naming: {
    entry: 'www/[name].[hash].[ext]'
  },
  target: 'browser',
  format: 'esm',
  packages: 'bundle',
  splitting: false,
  sourcemap: 'linked',
  minify: false, // Change to true to make the code fucking unreadable for almost no performance boost
  root: '.'
};

export default _;
