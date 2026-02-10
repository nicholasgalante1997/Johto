import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';
import type { FadeInConfig } from '../types';
import { DURATION } from '../types';

export interface UseFadeInOptions extends FadeInConfig {
  /** Auto-play on mount (default: true) */
  autoPlay?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Hook for simple fade-in animation
 */
export function useFadeIn<T extends HTMLElement = HTMLDivElement>(
  options: UseFadeInOptions = {}
) {
  const {
    y = 20,
    x = 0,
    fromOpacity = 0,
    duration = DURATION.normal,
    ease = 'power2.out',
    delay = 0,
    autoPlay = true,
    onComplete
  } = options;

  const ref = useRef<T>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || !autoPlay) return;

      if (prefersReducedMotion) {
        gsap.set(ref.current, { opacity: 1, x: 0, y: 0 });
        onComplete?.();
        return;
      }

      // Set initial state
      gsap.set(ref.current, {
        opacity: fromOpacity,
        x,
        y
      });

      // Animate
      gsap.to(ref.current, {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        ease,
        onComplete
      });
    },
    { scope: ref, dependencies: [autoPlay, prefersReducedMotion] }
  );

  return { ref };
}
