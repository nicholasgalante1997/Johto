// Configuration and core
export {
  gsap,
  useGSAP,
  isClient,
  getGsap,
  createTimeline,
  killTweens
} from './gsap-config';

// Types
export type {
  AnimationConfig,
  StaggerConfig,
  CardHoverConfig,
  FadeInConfig,
  EasingPreset
} from './types';

export { EASING_PRESETS, DURATION } from './types';

// Hooks
export * from './hooks';

// Transitions
export * from './transitions';
