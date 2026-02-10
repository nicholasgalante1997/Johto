import gsap from 'gsap';

// Only register plugins on client
if (typeof window !== 'undefined') {
  // Register GSAP plugins here when needed
  // Example: gsap.registerPlugin(ScrollTrigger);

  // Custom easing curves for Nebula theme
  gsap.registerEase('nebulaSpring', (progress: number) => {
    // Custom spring-like easing
    const c4 = (2 * Math.PI) / 3;
    return progress === 0
      ? 0
      : progress === 1
        ? 1
        : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) +
          1;
  });

  gsap.registerEase('nebulaSmooth', (progress: number) => {
    // Smooth deceleration
    return 1 - Math.pow(1 - progress, 4);
  });

  // Set global defaults
  gsap.defaults({
    ease: 'power2.out',
    duration: 0.3
  });

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const updateReducedMotion = (matches: boolean) => {
    if (matches) {
      gsap.globalTimeline.timeScale(20); // Make animations nearly instant
    } else {
      gsap.globalTimeline.timeScale(1);
    }
  };

  // Initial check
  updateReducedMotion(prefersReducedMotion.matches);

  // Listen for preference changes
  prefersReducedMotion.addEventListener('change', (e) => {
    updateReducedMotion(e.matches);
  });
}

// Re-export gsap for convenience
export { gsap };

// Export useGSAP from @gsap/react
export { useGSAP } from '@gsap/react';

/**
 * Check if we're in a browser environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely get gsap instance (returns null on server)
 */
export function getGsap(): typeof gsap | null {
  if (!isClient()) return null;
  return gsap;
}

/**
 * Create a timeline with SSR safety
 */
export function createTimeline(
  vars?: gsap.TimelineVars
): gsap.core.Timeline | null {
  if (!isClient()) return null;
  return gsap.timeline(vars);
}

/**
 * Kill all tweens on an element (cleanup helper)
 */
export function killTweens(target: gsap.TweenTarget): void {
  if (!isClient()) return;
  gsap.killTweensOf(target);
}
