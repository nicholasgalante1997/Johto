import { useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';
import type { StaggerConfig } from '../types';
import { DURATION } from '../types';

export interface UseStaggerOptions extends StaggerConfig {
  /** Selector for stagger items (default: '[data-stagger]') */
  selector?: string;
  /** Y offset to animate from (default: 30) */
  y?: number;
  /** Initial opacity (default: 0) */
  fromOpacity?: number;
  /** Initial scale (default: 0.95) */
  fromScale?: number;
  /** Auto-play on mount (default: true) */
  autoPlay?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Hook for staggered list/grid animations
 */
export function useStagger<T extends HTMLElement = HTMLDivElement>(
  options: UseStaggerOptions = {}
) {
  const {
    selector = '[data-stagger]',
    y = 30,
    fromOpacity = 0,
    fromScale = 0.98,
    stagger = 0.05,
    duration = DURATION.normal,
    ease = 'power2.out',
    delay = 0,
    from = 'start',
    autoPlay = true,
    onComplete
  } = options;

  const containerRef = useRef<T>(null);
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    if (elements.length === 0) return;

    // Skip animation if reduced motion or already animated
    if (prefersReducedMotion) {
      gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
      onComplete?.();
      return;
    }

    // Set initial state
    gsap.set(elements, {
      opacity: fromOpacity,
      y,
      scale: fromScale
    });

    // Animate
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      delay,
      ease,
      stagger: {
        amount:
          typeof stagger === 'number' ? stagger * elements.length : undefined,
        each: typeof stagger === 'number' ? stagger : undefined,
        from,
        ...(typeof stagger === 'object' ? stagger : {})
      },
      onComplete
    });

    hasAnimated.current = true;
  }, [
    selector,
    y,
    fromOpacity,
    fromScale,
    stagger,
    duration,
    ease,
    delay,
    from,
    onComplete,
    prefersReducedMotion
  ]);

  // Auto-play on mount if enabled
  useGSAP(
    () => {
      if (autoPlay && !hasAnimated.current) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(animate, 50);
        return () => clearTimeout(timer);
      }
    },
    { scope: containerRef, dependencies: [autoPlay, animate] }
  );

  // Reset function for re-triggering animation
  const reset = useCallback(() => {
    hasAnimated.current = false;
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(selector);
      gsap.set(elements, { opacity: fromOpacity, y, scale: fromScale });
    }
  }, [selector, y, fromOpacity, fromScale]);

  return {
    containerRef,
    animate,
    reset,
    hasAnimated: hasAnimated.current
  };
}
