import gsap from 'gsap';
import { DURATION } from '../../types';

/**
 * Creates a page exit timeline animation.
 * Fades out and slides up the page content.
 */
export function createPageExitTimeline(
  element: HTMLElement,
  options: { duration?: number; y?: number } = {}
): gsap.core.Timeline {
  const { duration = DURATION.fast, y = -10 } = options;

  const tl = gsap.timeline();

  tl.to(element, {
    opacity: 0,
    y,
    duration,
    ease: 'power2.in'
  });

  return tl;
}
