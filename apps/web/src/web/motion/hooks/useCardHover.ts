import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';
import type { CardHoverConfig } from '../types';
import { DURATION } from '../types';

/**
 * Hook for 3D card hover effect with tilt and glow
 */
export function useCardHover(options: CardHoverConfig = {}) {
  const {
    scale = 1.02,
    rotation = 5,
    glow = true,
    glowColor = 'rgba(32, 129, 226, 0.4)',
    duration = DURATION.normal,
    tilt = true
  } = options;

  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current || prefersReducedMotion) return;
    isHovered.current = true;

    gsap.to(cardRef.current, {
      scale,
      duration,
      ease: 'back.out(1.7)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    });

    if (glow && glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 1,
        duration: duration * 0.5
      });
    }
  }, [scale, duration, glow, prefersReducedMotion]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (
        !cardRef.current ||
        !isHovered.current ||
        prefersReducedMotion ||
        !tilt
      )
        return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = event.clientX - centerX;
      const mouseY = event.clientY - centerY;

      // Calculate rotation based on mouse position
      const rotateX = (mouseY / (rect.height / 2)) * -rotation;
      const rotateY = (mouseX / (rect.width / 2)) * rotation;

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out'
      });

      // Update glow position to follow mouse
      if (glow && glowRef.current) {
        const glowX = ((event.clientX - rect.left) / rect.width) * 100;
        const glowY = ((event.clientY - rect.top) / rect.height) * 100;

        glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}, transparent 60%)`;
      }
    },
    [rotation, glow, glowColor, tilt, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    isHovered.current = false;

    gsap.to(cardRef.current, {
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      duration,
      ease: 'power2.out'
    });

    if (glow && glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0,
        duration: duration * 0.5
      });
    }
  }, [duration, glow]);

  // Set up event listeners and initial styles
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Set initial transform style for 3D effect
    gsap.set(card, {
      transformPerspective: 1000,
      transformStyle: 'preserve-3d'
    });

    // Add event listeners
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(card);
    };
  }, [handleMouseEnter, handleMouseMove, handleMouseLeave]);

  return { cardRef, glowRef };
}
