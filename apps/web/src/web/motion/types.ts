import type { gsap } from 'gsap';

export interface AnimationConfig {
  duration?: number;
  ease?: string;
  delay?: number;
}

export interface StaggerConfig extends AnimationConfig {
  stagger?: number | gsap.StaggerVars;
  from?: 'start' | 'end' | 'center' | 'edges' | 'random' | number;
}

export interface CardHoverConfig {
  /** Scale on hover (default: 1.02) */
  scale?: number;
  /** Maximum rotation in degrees (default: 5) */
  rotation?: number;
  /** Enable glow effect (default: true in Nebula theme) */
  glow?: boolean;
  /** Glow color (default: primary accent) */
  glowColor?: string;
  /** Animation duration in seconds (default: 0.3) */
  duration?: number;
  /** Enable 3D perspective tilt (default: true) */
  tilt?: boolean;
}

export interface FadeInConfig extends AnimationConfig {
  /** Y offset to animate from (default: 20) */
  y?: number;
  /** X offset to animate from (default: 0) */
  x?: number;
  /** Initial opacity (default: 0) */
  fromOpacity?: number;
}

export type EasingPreset =
  | 'default'
  | 'spring'
  | 'bounce'
  | 'smooth'
  | 'snappy'
  | 'gentle';

export const EASING_PRESETS: Record<EasingPreset, string> = {
  default: 'power2.out',
  spring: 'back.out(1.7)',
  bounce: 'bounce.out',
  smooth: 'power3.inOut',
  snappy: 'power4.out',
  gentle: 'sine.out'
};

export const DURATION = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8
} as const;
