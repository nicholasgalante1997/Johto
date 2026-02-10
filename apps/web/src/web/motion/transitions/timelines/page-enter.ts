import gsap from 'gsap';
import { DURATION } from '../../types';

/**
 * Creates a page enter timeline animation.
 * Fades in and slides up the page content.
 */
export function createPageEnterTimeline(
  element: HTMLElement,
  options: { duration?: number; y?: number } = {}
): gsap.core.Timeline {
  const { duration = DURATION.normal, y = 20 } = options;

  const tl = gsap.timeline();

  tl.fromTo(
    element,
    {
      opacity: 0,
      y
    },
    {
      opacity: 1,
      y: 0,
      duration,
      ease: 'power2.out'
    }
  );

  return tl;
}
