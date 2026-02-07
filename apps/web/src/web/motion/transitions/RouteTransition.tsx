import { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { createPageEnterTimeline, createPageExitTimeline } from './timelines';

export interface RouteTransitionProps {
  children: React.ReactNode;
}

/**
 * Wraps page content and animates on route changes.
 * Runs exit animation on old content, then enter animation on new content.
 * Respects prefers-reduced-motion.
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname);
  const prefersReducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial enter animation on mount
  useEffect(() => {
    if (!isClient || !containerRef.current || prefersReducedMotion) return;

    gsap.set(containerRef.current, { opacity: 0, y: 20 });
    createPageEnterTimeline(containerRef.current);
  }, [isClient, prefersReducedMotion]);

  // Animate on route change
  useEffect(() => {
    if (!isClient || !containerRef.current || prefersReducedMotion) return;
    if (prevPathRef.current === location.pathname) return;

    prevPathRef.current = location.pathname;
    const el = containerRef.current;

    // Quick enter for route changes (exit is instant since React swaps content)
    gsap.set(el, { opacity: 0, y: 15 });
    createPageEnterTimeline(el, { duration: 0.25, y: 15 });
  }, [location.pathname, isClient, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="route-transition">
      {children}
    </div>
  );
}
