export interface WebGLCanvasProps {
  /** Additional CSS class names */
  className?: string;
  /** Background effect type */
  background?: 'particles' | 'none';
  /** Primary color for particles (hex string) */
  color?: string;
  /** Secondary color for particles (hex string) */
  secondaryColor?: string;
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Particle count override (uses adaptive count if not set) */
  particleCount?: number;
  /** CSS gradient fallback when WebGL unavailable */
  fallbackGradient?: string;
  /** Enable mouse interaction */
  mouseInteraction?: boolean;
  /** Fixed height in pixels (default: fills container) */
  height?: number | string;
}
