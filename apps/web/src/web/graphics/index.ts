// Types
export type {
  PerformanceTier,
  WebGLCapabilities,
  SceneLayerConfig,
  ParticleFieldOptions,
  WebGLCanvasOptions
} from './types';

// Utilities
export * from './utils';

// Three.js
export {
  SceneManager,
  type SceneManagerOptions,
  createParticleField,
  createMouseHandlers,
  type ParticleFieldConfig
} from './three';

// Shaders
export * from './shaders';
