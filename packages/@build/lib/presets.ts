import type { BuildConfig } from 'bun';

export function library(overrides: Partial<BuildConfig> = {}): BuildConfig {
  return {
    entrypoints: ['lib/index.ts'],
    outdir: './out',
    target: 'bun',
    format: 'esm',
    splitting: false,
    sourcemap: 'linked',
    minify: false,
    root: '.',
    packages: 'external',
    ...overrides
  };
}

export function server(overrides: Partial<BuildConfig> = {}): BuildConfig {
  return {
    entrypoints: ['src/index.ts'],
    outdir: './dist',
    target: 'bun',
    format: 'esm',
    splitting: false,
    sourcemap: 'linked',
    minify: false,
    root: '.',
    packages: 'external',
    env: 'inline',
    ...overrides
  };
}

export function browser(overrides: Partial<BuildConfig> = {}): BuildConfig {
  if (!('entrypoints' in overrides)) {
    throw new Error('[entrypoints] must be supplied to browser config');
  }

  return {
    outdir: './out',
    target: 'browser',
    format: 'esm',
    splitting: false,
    sourcemap: 'linked',
    minify: false,
    root: '.',
    packages: 'bundle',
    env: 'inline',
    jsx: {
      runtime: 'automatic',
      importSource: 'react'
    },
    ...overrides,
    entrypoints: overrides.entrypoints || []
  };
}
