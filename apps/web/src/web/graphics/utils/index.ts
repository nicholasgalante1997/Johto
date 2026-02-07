export {
  detectWebGLSupport,
  detectWebGL2Support,
  isMobile,
  prefersReducedMotion,
  getPerformanceTier,
  getWebGLCapabilities,
  getRecommendedParticleCount,
  getRecommendedPixelRatio
} from './webgl-detect';

export {
  PerformanceMonitor,
  QualityManager,
  createFrameThrottler
} from './performance';

export {
  disposeMaterial,
  disposeGeometry,
  disposeObject,
  disposeScene,
  disposeRenderer,
  disposeAll
} from './dispose';
