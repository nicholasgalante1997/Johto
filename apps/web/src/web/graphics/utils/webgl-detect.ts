import type { PerformanceTier, WebGLCapabilities } from '../types';

/**
 * Check if WebGL is supported in the current environment
 */
export function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * Check if WebGL2 is supported
 */
export function detectWebGL2Support(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/**
 * Detect if we're on a mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get the performance tier based on device capabilities
 */
export function getPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'medium';

  // Check for reduced motion preference
  if (prefersReducedMotion()) return 'low';

  // Mobile devices default to medium or low
  if (isMobile()) {
    // Check for high-end mobile (newer iPhones, flagship Android)
    const isHighEndMobile =
      navigator.hardwareConcurrency >= 6 ||
      // @ts-ignore - deviceMemory is not in all browsers
      (navigator.deviceMemory && navigator.deviceMemory >= 6);

    return isHighEndMobile ? 'medium' : 'low';
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;

    if (!gl) return 'low';

    // Get renderer info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : '';

    // Check for known low-performance renderers
    if (/SwiftShader|Software|Mesa|Intel.*HD.*[2-4]000/i.test(renderer)) {
      return 'low';
    }

    // Check for integrated graphics (medium tier)
    if (/Intel|Mali|Adreno.*[2-5]\d{2}|Apple.*GPU/i.test(renderer)) {
      return 'medium';
    }

    // Check hardware concurrency
    if (navigator.hardwareConcurrency >= 8) {
      return 'high';
    }

    // Default to medium
    return 'medium';
  } catch {
    return 'medium';
  }
}

/**
 * Get full WebGL capabilities info
 */
export function getWebGLCapabilities(): WebGLCapabilities {
  const defaultCaps: WebGLCapabilities = {
    supported: false,
    tier: 'low',
    maxTextureSize: 0,
    maxVertexUniforms: 0,
    renderer: 'unknown',
    vendor: 'unknown'
  };

  if (typeof window === 'undefined') return defaultCaps;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;

    if (!gl) return defaultCaps;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    return {
      supported: true,
      tier: getPerformanceTier(),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      renderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'unknown',
      vendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : 'unknown'
    };
  } catch {
    return defaultCaps;
  }
}

/**
 * Get recommended particle count based on performance tier
 */
export function getRecommendedParticleCount(tier: PerformanceTier): number {
  switch (tier) {
    case 'high':
      return 2000;
    case 'medium':
      return 800;
    case 'low':
      return 300;
    default:
      return 500;
  }
}

/**
 * Get recommended pixel ratio based on performance tier
 */
export function getRecommendedPixelRatio(tier: PerformanceTier): number {
  const devicePixelRatio =
    typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  switch (tier) {
    case 'high':
      return Math.min(devicePixelRatio, 2);
    case 'medium':
      return Math.min(devicePixelRatio, 1.5);
    case 'low':
      return 1;
    default:
      return Math.min(devicePixelRatio, 1.5);
  }
}
