import { useEffect, useState, useRef, useCallback } from 'react';
import type { WebGLCanvasProps } from './types';
import './WebGLCanvas.css';

// Default fallback gradient matching Nebula theme
const DEFAULT_FALLBACK =
  'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)';

export function WebGLCanvas({
  className = '',
  background = 'particles',
  color = '#2081e2',
  secondaryColor = '#7b61ff',
  intensity = 1,
  particleCount,
  fallbackGradient = DEFAULT_FALLBACK,
  mouseInteraction = true,
  height
}: WebGLCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    manager: import('../../graphics').SceneManager;
    particleField?: import('../../graphics').ParticleFieldConfig;
    mouseCleanup?: () => void;
  } | null>(null);

  // SSR safety: track if we're on client
  const [isClient, setIsClient] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Detect client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize three.js on client only
  useEffect(() => {
    if (!isClient || !canvasRef.current || !containerRef.current) return;
    if (background === 'none') return;

    // Dynamic import to avoid SSR issues
    Promise.all([import('../../graphics'), import('../../graphics/three')])
      .then(([graphics, three]) => {
        const { detectWebGLSupport, getPerformanceTier } = graphics;
        const { SceneManager, createParticleField, createMouseHandlers } =
          three;

        // Check WebGL support
        if (!detectWebGLSupport()) {
          setWebglSupported(false);
          return;
        }

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Get performance tier for adaptive quality
        const tier = getPerformanceTier();

        // Create scene manager
        const manager = new SceneManager({
          canvas,
          alpha: true,
          antialias: tier !== 'low',
          adaptiveQuality: true
        });

        // Create particle field if requested
        let particleField:
          | import('../../graphics').ParticleFieldConfig
          | undefined;
        let mouseCleanup: (() => void) | undefined;

        if (background === 'particles') {
          particleField = createParticleField({
            particleCount,
            color,
            secondaryColor,
            speed: 0.3 * intensity,
            mouseInfluence: mouseInteraction ? 0.5 * intensity : 0,
            performanceTier: tier
          });

          manager.addLayer(particleField);

          // Set up mouse tracking
          if (mouseInteraction) {
            const handlers = createMouseHandlers(particleField, container);
            mouseCleanup = handlers.cleanup;
          }
        }

        // Store refs
        sceneRef.current = {
          manager,
          particleField,
          mouseCleanup
        };

        // Start animation
        manager.start();

        // Cleanup on unmount
        return () => {
          mouseCleanup?.();
          manager.dispose();
          sceneRef.current = null;
        };
      })
      .catch((error) => {
        console.error('[WebGLCanvas] Failed to initialize:', error);
        setWebglSupported(false);
      });
  }, [
    isClient,
    background,
    color,
    secondaryColor,
    intensity,
    particleCount,
    mouseInteraction
  ]);

  // Calculate height style
  const heightStyle = height
    ? typeof height === 'number'
      ? `${height}px`
      : height
    : undefined;

  // SSR: render placeholder with matching dimensions
  if (!isClient) {
    return (
      <div
        className={`webgl-canvas webgl-canvas--ssr ${className}`}
        style={{
          background: fallbackGradient,
          height: heightStyle
        }}
        aria-hidden="true"
      />
    );
  }

  // No WebGL or background disabled: show fallback
  if (!webglSupported || background === 'none') {
    return (
      <div
        ref={containerRef}
        className={`webgl-canvas webgl-canvas--fallback ${className}`}
        style={{
          background: fallbackGradient,
          height: heightStyle
        }}
        aria-hidden="true"
      />
    );
  }

  // Client with WebGL: render canvas
  return (
    <div
      ref={containerRef}
      className={`webgl-canvas ${className}`}
      style={{ height: heightStyle }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="webgl-canvas__canvas" />
    </div>
  );
}
