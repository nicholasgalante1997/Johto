# UI Migration Specification: OpenSea-Inspired Theme with WebGL & GSAP

## Overview

This specification defines the migration of the Pokemon TCG Platform UI from the current Catppuccin Mocha theme to a modern, OpenSea-inspired design system featuring three.js WebGL backgrounds, custom shader effects, and GSAP-powered animations.

**Current State:**
The platform uses a Catppuccin Mocha dark theme with:

- CSS custom properties for theming
- Component-scoped BEM CSS
- Basic CSS transitions (0.15s ease)
- No WebGL, Canvas, or advanced animation libraries
- 22 component directories with co-located styles

**Proposed Solution:**
A phased migration introducing:

- New "Nebula" theme inspired by OpenSea's modern marketplace aesthetic
- three.js WebGL background system with interactive particle fields
- Custom GLSL shaders for card effects (holographic, shimmer, glow)
- GSAP-powered micro-interactions and page transitions
- Theme switching capability (legacy Catppuccin preserved)
- Progressive enhancement (graceful degradation without WebGL)

**Design Philosophy:**

- Premium marketplace feel befitting collectible trading cards
- Depth through layered glassmorphism and subtle 3D
- Motion that enhances without overwhelming
- Performance-first with lazy-loaded effects
- Accessibility maintained through reduced-motion support

---

## Package Structure

```
apps/web/
├── src/
│   ├── web/
│   │   ├── themes/                          # NEW: Theme system
│   │   │   ├── index.ts                     # Theme exports & switching
│   │   │   ├── types.ts                     # Theme type definitions
│   │   │   ├── ThemeProvider.tsx            # React context for theming
│   │   │   ├── catppuccin/                  # DEPRECATED: Legacy theme
│   │   │   │   ├── index.ts
│   │   │   │   ├── tokens.ts                # Extracted from current CSS
│   │   │   │   └── catppuccin.css
│   │   │   └── nebula/                      # NEW: OpenSea-inspired theme
│   │   │       ├── index.ts
│   │   │       ├── tokens.ts                # Design tokens
│   │   │       ├── nebula.css               # Base styles
│   │   │       ├── animations.css           # Keyframe definitions
│   │   │       └── utilities.css            # Utility classes
│   │   │
│   │   ├── graphics/                        # NEW: WebGL & 3D system
│   │   │   ├── index.ts                     # Graphics exports
│   │   │   ├── types.ts                     # Graphics type definitions
│   │   │   ├── three/                       # three.js implementations
│   │   │   │   ├── index.ts
│   │   │   │   ├── SceneManager.ts          # Scene lifecycle management
│   │   │   │   ├── backgrounds/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── ParticleField.ts     # Floating particle system
│   │   │   │   │   ├── GradientMesh.ts      # Animated gradient mesh
│   │   │   │   │   └── WaveGrid.ts          # Undulating grid effect
│   │   │   │   ├── effects/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── CardHolographic.ts   # Holographic card shader
│   │   │   │   │   ├── CardGlow.ts          # Rarity-based glow effect
│   │   │   │   │   └── MouseTrail.ts        # Cursor trail effect
│   │   │   │   └── utils/
│   │   │   │       ├── index.ts
│   │   │   │       ├── webgl-detect.ts      # WebGL capability detection
│   │   │   │       ├── performance.ts       # FPS monitoring & throttling
│   │   │   │       └── dispose.ts           # Memory cleanup utilities
│   │   │   │
│   │   │   └── shaders/                     # GLSL shader programs
│   │   │       ├── index.ts
│   │   │       ├── particle.vert            # Particle vertex shader
│   │   │       ├── particle.frag            # Particle fragment shader
│   │   │       ├── holographic.vert         # Holographic card vertex
│   │   │       ├── holographic.frag         # Holographic card fragment
│   │   │       ├── gradient-mesh.vert       # Gradient mesh vertex
│   │   │       ├── gradient-mesh.frag       # Gradient mesh fragment
│   │   │       ├── glow.frag                # Glow post-process
│   │   │       └── noise.glsl               # Shared noise functions
│   │   │
│   │   ├── motion/                          # NEW: GSAP animation system
│   │   │   ├── index.ts                     # Motion exports
│   │   │   ├── types.ts                     # Animation type definitions
│   │   │   ├── gsap-config.ts               # GSAP plugin registration
│   │   │   ├── timelines/
│   │   │   │   ├── index.ts
│   │   │   │   ├── page-enter.ts            # Page entrance animations
│   │   │   │   ├── page-exit.ts             # Page exit animations
│   │   │   │   └── modal-transitions.ts     # Modal open/close
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   ├── useGsapTimeline.ts       # Timeline management hook
│   │   │   │   ├── useScrollTrigger.ts      # Scroll-based animations
│   │   │   │   ├── useStagger.ts            # Staggered list animations
│   │   │   │   └── useReducedMotion.ts      # Accessibility hook
│   │   │   ├── presets/
│   │   │   │   ├── index.ts
│   │   │   │   ├── card-hover.ts            # Card hover micro-interactions
│   │   │   │   ├── button-press.ts          # Button press feedback
│   │   │   │   ├── toast-slide.ts           # Toast notifications
│   │   │   │   └── skeleton-shimmer.ts      # Loading skeleton pulse
│   │   │   └── transitions/
│   │   │       ├── index.ts
│   │   │       ├── TransitionProvider.tsx   # Page transition context
│   │   │       └── RouteTransition.tsx      # Route change wrapper
│   │   │
│   │   ├── components/                      # MODIFIED: Updated components
│   │   │   ├── WebGLCanvas/                 # NEW: WebGL container
│   │   │   │   ├── index.ts
│   │   │   │   ├── WebGLCanvas.tsx
│   │   │   │   ├── WebGLCanvas.css
│   │   │   │   └── types.ts
│   │   │   ├── Card/                        # MODIFIED: Add shader effects
│   │   │   │   ├── Card.tsx                 # Updated with hover effects
│   │   │   │   ├── Card.css                 # Nebula theme styles
│   │   │   │   ├── Card.legacy.css          # DEPRECATED: Catppuccin styles
│   │   │   │   └── CardShaderOverlay.tsx    # NEW: WebGL overlay
│   │   │   ├── ThemeToggle/                 # NEW: Theme switcher
│   │   │   │   ├── index.ts
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   └── ThemeToggle.css
│   │   │   └── ... (other components)
│   │   │
│   │   └── contexts/
│   │       └── Theme.tsx                    # NEW: Theme context
│   │
│   └── public/
│       └── css/
│           ├── index.css                    # MODIFIED: Theme switching support
│           ├── index.legacy.css             # DEPRECATED: Current Catppuccin
│           └── nebula/                      # NEW: Nebula theme assets
│               ├── variables.css
│               └── components.css
│
├── package.json                             # Add three.js, gsap dependencies
└── tsconfig.json                            # Add GLSL type support
```

---

## Design System: Nebula Theme

### 1. Color Palette

The Nebula theme draws from OpenSea's sophisticated dark marketplace aesthetic with vibrant accent colors that complement Pokemon TCG card art.

```css
/* apps/web/src/web/themes/nebula/tokens.ts → CSS Variables */

:root[data-theme='nebula'] {
  /* ═══════════════════════════════════════════════════════════════
     BASE COLORS - Deep space-inspired neutrals
     ═══════════════════════════════════════════════════════════════ */

  /* Backgrounds - Layered depth system */
  --nebula-bg-primary: #0a0a0f; /* Deepest background */
  --nebula-bg-secondary: #12121a; /* Card/panel backgrounds */
  --nebula-bg-tertiary: #1a1a24; /* Elevated surfaces */
  --nebula-bg-elevated: #22222e; /* Hover/active surfaces */
  --nebula-bg-overlay: rgba(10, 10, 15, 0.85); /* Modal overlays */

  /* Surfaces - Glassmorphism layers */
  --nebula-surface-glass: rgba(255, 255, 255, 0.03);
  --nebula-surface-glass-hover: rgba(255, 255, 255, 0.06);
  --nebula-surface-glass-active: rgba(255, 255, 255, 0.08);
  --nebula-surface-border: rgba(255, 255, 255, 0.08);
  --nebula-surface-border-hover: rgba(255, 255, 255, 0.15);

  /* ═══════════════════════════════════════════════════════════════
     TEXT COLORS - High contrast hierarchy
     ═══════════════════════════════════════════════════════════════ */

  --nebula-text-primary: #ffffff;
  --nebula-text-secondary: rgba(255, 255, 255, 0.7);
  --nebula-text-tertiary: rgba(255, 255, 255, 0.5);
  --nebula-text-muted: rgba(255, 255, 255, 0.35);
  --nebula-text-disabled: rgba(255, 255, 255, 0.2);

  /* ═══════════════════════════════════════════════════════════════
     ACCENT COLORS - Vibrant marketplace accents
     ═══════════════════════════════════════════════════════════════ */

  /* Primary Blue - Actions, links, focus states */
  --nebula-accent-primary: #2081e2;
  --nebula-accent-primary-hover: #3898ff;
  --nebula-accent-primary-active: #1868b7;
  --nebula-accent-primary-subtle: rgba(32, 129, 226, 0.15);

  /* Secondary Purple - Premium features, rare items */
  --nebula-accent-secondary: #7b61ff;
  --nebula-accent-secondary-hover: #9580ff;
  --nebula-accent-secondary-subtle: rgba(123, 97, 255, 0.15);

  /* Success Green - Positive actions, gains */
  --nebula-semantic-success: #34c759;
  --nebula-semantic-success-subtle: rgba(52, 199, 89, 0.15);

  /* Warning Yellow - Cautions, pending */
  --nebula-semantic-warning: #ffcc00;
  --nebula-semantic-warning-subtle: rgba(255, 204, 0, 0.15);

  /* Error Red - Destructive, losses */
  --nebula-semantic-error: #ff3b30;
  --nebula-semantic-error-subtle: rgba(255, 59, 48, 0.15);

  /* ═══════════════════════════════════════════════════════════════
     GRADIENT DEFINITIONS - OpenSea-inspired gradients
     ═══════════════════════════════════════════════════════════════ */

  --nebula-gradient-primary: linear-gradient(135deg, #2081e2 0%, #7b61ff 100%);
  --nebula-gradient-shimmer: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  --nebula-gradient-card-rare: linear-gradient(
    135deg,
    rgba(123, 97, 255, 0.2) 0%,
    rgba(32, 129, 226, 0.2) 100%
  );
  --nebula-gradient-holographic: linear-gradient(
    45deg,
    #ff0080 0%,
    #ff8c00 14%,
    #40e0d0 28%,
    #7b68ee 42%,
    #ff0080 56%,
    #ff8c00 70%,
    #40e0d0 84%,
    #7b68ee 100%
  );

  /* ═══════════════════════════════════════════════════════════════
     SHADOWS - Depth and elevation system
     ═══════════════════════════════════════════════════════════════ */

  --nebula-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --nebula-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --nebula-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --nebula-shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);
  --nebula-shadow-glow-blue: 0 0 20px rgba(32, 129, 226, 0.4);
  --nebula-shadow-glow-purple: 0 0 20px rgba(123, 97, 255, 0.4);

  /* ═══════════════════════════════════════════════════════════════
     BLUR & EFFECTS
     ═══════════════════════════════════════════════════════════════ */

  --nebula-blur-glass: 12px;
  --nebula-blur-overlay: 8px;

  /* ═══════════════════════════════════════════════════════════════
     POKEMON TCG TYPE COLORS - Enhanced for Nebula theme
     ═══════════════════════════════════════════════════════════════ */

  --pokemon-type-colorless: #a8a8b8;
  --pokemon-type-darkness: #5a4a6a;
  --pokemon-type-dragon: #8b5cf6;
  --pokemon-type-fairy: #f472b6;
  --pokemon-type-fighting: #ef4444;
  --pokemon-type-fire: #f97316;
  --pokemon-type-grass: #22c55e;
  --pokemon-type-lightning: #facc15;
  --pokemon-type-metal: #94a3b8;
  --pokemon-type-psychic: #ec4899;
  --pokemon-type-water: #3b82f6;

  /* ═══════════════════════════════════════════════════════════════
     RARITY COLORS - Premium marketplace feel
     ═══════════════════════════════════════════════════════════════ */

  --pokemon-rarity-common: var(--nebula-text-muted);
  --pokemon-rarity-uncommon: var(--nebula-text-tertiary);
  --pokemon-rarity-rare: var(--nebula-accent-primary);
  --pokemon-rarity-rare-holo: var(--nebula-accent-secondary);
  --pokemon-rarity-rare-ultra: #f472b6;
  --pokemon-rarity-rare-secret: linear-gradient(
    90deg,
    #fbbf24,
    #f59e0b,
    #fbbf24
  );
}
```

### 2. Typography System

```css
:root[data-theme='nebula'] {
  /* ═══════════════════════════════════════════════════════════════
     FONT FAMILIES
     ═══════════════════════════════════════════════════════════════ */

  --nebula-font-sans:
    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --nebula-font-display: 'Plus Jakarta Sans', var(--nebula-font-sans);
  --nebula-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ═══════════════════════════════════════════════════════════════
     TYPE SCALE - Fluid sizing with clamp()
     ═══════════════════════════════════════════════════════════════ */

  --nebula-text-xs: clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem); /* 11-12px */
  --nebula-text-sm: clamp(0.8125rem, 0.78rem + 0.1vw, 0.875rem); /* 13-14px */
  --nebula-text-base: clamp(0.875rem, 0.85rem + 0.1vw, 1rem); /* 14-16px */
  --nebula-text-lg: clamp(1rem, 0.95rem + 0.2vw, 1.125rem); /* 16-18px */
  --nebula-text-xl: clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem); /* 18-20px */
  --nebula-text-2xl: clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem); /* 20-24px */
  --nebula-text-3xl: clamp(1.5rem, 1.35rem + 0.6vw, 1.875rem); /* 24-30px */
  --nebula-text-4xl: clamp(1.875rem, 1.65rem + 0.9vw, 2.25rem); /* 30-36px */
  --nebula-text-5xl: clamp(2.25rem, 1.95rem + 1.2vw, 3rem); /* 36-48px */

  /* ═══════════════════════════════════════════════════════════════
     FONT WEIGHTS
     ═══════════════════════════════════════════════════════════════ */

  --nebula-weight-normal: 400;
  --nebula-weight-medium: 500;
  --nebula-weight-semibold: 600;
  --nebula-weight-bold: 700;

  /* ═══════════════════════════════════════════════════════════════
     LINE HEIGHTS
     ═══════════════════════════════════════════════════════════════ */

  --nebula-leading-none: 1;
  --nebula-leading-tight: 1.2;
  --nebula-leading-snug: 1.375;
  --nebula-leading-normal: 1.5;
  --nebula-leading-relaxed: 1.625;

  /* ═══════════════════════════════════════════════════════════════
     LETTER SPACING
     ═══════════════════════════════════════════════════════════════ */

  --nebula-tracking-tight: -0.025em;
  --nebula-tracking-normal: 0;
  --nebula-tracking-wide: 0.025em;
  --nebula-tracking-wider: 0.05em;
  --nebula-tracking-widest: 0.1em;
}
```

### 3. Spacing & Layout

```css
:root[data-theme='nebula'] {
  /* ═══════════════════════════════════════════════════════════════
     SPACING SCALE - 4px base unit
     ═══════════════════════════════════════════════════════════════ */

  --nebula-space-0: 0;
  --nebula-space-1: 0.25rem; /* 4px */
  --nebula-space-2: 0.5rem; /* 8px */
  --nebula-space-3: 0.75rem; /* 12px */
  --nebula-space-4: 1rem; /* 16px */
  --nebula-space-5: 1.25rem; /* 20px */
  --nebula-space-6: 1.5rem; /* 24px */
  --nebula-space-8: 2rem; /* 32px */
  --nebula-space-10: 2.5rem; /* 40px */
  --nebula-space-12: 3rem; /* 48px */
  --nebula-space-16: 4rem; /* 64px */
  --nebula-space-20: 5rem; /* 80px */
  --nebula-space-24: 6rem; /* 96px */

  /* ═══════════════════════════════════════════════════════════════
     BORDER RADIUS - Rounded corners
     ═══════════════════════════════════════════════════════════════ */

  --nebula-radius-none: 0;
  --nebula-radius-sm: 0.375rem; /* 6px */
  --nebula-radius-md: 0.5rem; /* 8px */
  --nebula-radius-lg: 0.75rem; /* 12px */
  --nebula-radius-xl: 1rem; /* 16px */
  --nebula-radius-2xl: 1.25rem; /* 20px */
  --nebula-radius-full: 9999px;

  /* ═══════════════════════════════════════════════════════════════
     LAYOUT CONTAINERS
     ═══════════════════════════════════════════════════════════════ */

  --nebula-container-sm: 640px;
  --nebula-container-md: 768px;
  --nebula-container-lg: 1024px;
  --nebula-container-xl: 1280px;
  --nebula-container-2xl: 1536px;

  /* Sidebar dimensions */
  --nebula-sidebar-width: 280px;
  --nebula-sidebar-collapsed: 72px;

  /* Header height */
  --nebula-header-height: 72px;
}
```

### 4. Animation Timing Functions

```css
:root[data-theme='nebula'] {
  /* ═══════════════════════════════════════════════════════════════
     EASING CURVES - Natural motion
     ═══════════════════════════════════════════════════════════════ */

  --nebula-ease-linear: linear;
  --nebula-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --nebula-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --nebula-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Spring-like curves for bouncy interactions */
  --nebula-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --nebula-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Smooth deceleration for reveals */
  --nebula-ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* ═══════════════════════════════════════════════════════════════
     DURATION SCALE
     ═══════════════════════════════════════════════════════════════ */

  --nebula-duration-instant: 0ms;
  --nebula-duration-fast: 100ms;
  --nebula-duration-normal: 200ms;
  --nebula-duration-slow: 300ms;
  --nebula-duration-slower: 500ms;
  --nebula-duration-slowest: 800ms;

  /* Page transitions */
  --nebula-duration-page-enter: 600ms;
  --nebula-duration-page-exit: 400ms;
}
```

---

## three.js WebGL System

### 1. Scene Manager

The `SceneManager` handles the lifecycle of three.js scenes, including initialization, animation loops, and cleanup.

```typescript
// apps/web/src/web/graphics/three/SceneManager.ts

import * as THREE from 'three';
import { detectWebGLSupport, getPerformanceTier } from '../utils/webgl-detect';
import { PerformanceMonitor } from '../utils/performance';

export interface SceneManagerOptions {
  canvas: HTMLCanvasElement;
  backgroundColor?: number;
  antialias?: boolean;
  alpha?: boolean;
  pixelRatio?: number;
  maxPixelRatio?: number;
}

export interface SceneLayer {
  id: string;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderOrder: number;
  update?: (deltaTime: number, elapsedTime: number) => void;
  dispose?: () => void;
}

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private layers: Map<string, SceneLayer> = new Map();
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private performanceMonitor: PerformanceMonitor;
  private performanceTier: 'high' | 'medium' | 'low';

  constructor(options: SceneManagerOptions) {
    const {
      canvas,
      backgroundColor = 0x0a0a0f,
      antialias = true,
      alpha = true,
      pixelRatio = window.devicePixelRatio,
      maxPixelRatio = 2
    } = options;

    // Detect performance tier for adaptive quality
    this.performanceTier = getPerformanceTier();

    // Initialize renderer with performance-appropriate settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.performanceTier !== 'low' && antialias,
      alpha,
      powerPreference:
        this.performanceTier === 'high' ? 'high-performance' : 'default'
    });

    this.renderer.setPixelRatio(Math.min(pixelRatio, maxPixelRatio));
    this.renderer.setClearColor(backgroundColor, alpha ? 0 : 1);
    this.renderer.autoClear = false;

    this.clock = new THREE.Clock();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Add a rendering layer (background, effects, etc.)
   */
  addLayer(layer: SceneLayer): void {
    this.layers.set(layer.id, layer);
    this.sortLayers();
  }

  /**
   * Remove a layer and dispose its resources
   */
  removeLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.dispose?.();
      this.layers.delete(id);
    }
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resize handler for responsive canvas
   */
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);

    // Update all layer cameras
    this.layers.forEach((layer) => {
      if (layer.camera instanceof THREE.PerspectiveCamera) {
        layer.camera.aspect = width / height;
        layer.camera.updateProjectionMatrix();
      } else if (layer.camera instanceof THREE.OrthographicCamera) {
        const aspect = width / height;
        layer.camera.left = -aspect;
        layer.camera.right = aspect;
        layer.camera.updateProjectionMatrix();
      }
    });
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    this.performanceMonitor.begin();

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Clear the canvas
    this.renderer.clear();

    // Render each layer in order
    const sortedLayers = Array.from(this.layers.values()).sort(
      (a, b) => a.renderOrder - b.renderOrder
    );

    for (const layer of sortedLayers) {
      layer.update?.(deltaTime, elapsedTime);
      this.renderer.render(layer.scene, layer.camera);
    }

    this.performanceMonitor.end();

    // Adaptive quality based on performance
    if (this.performanceMonitor.shouldReduceQuality()) {
      this.reduceQuality();
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Reduce quality for performance
   */
  private reduceQuality(): void {
    const currentRatio = this.renderer.getPixelRatio();
    if (currentRatio > 1) {
      this.renderer.setPixelRatio(Math.max(1, currentRatio - 0.25));
    }
  }

  /**
   * Sort layers by render order
   */
  private sortLayers(): void {
    // Layers are sorted during render, no need to store sorted
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stop();
    this.layers.forEach((layer) => layer.dispose?.());
    this.layers.clear();
    this.renderer.dispose();
  }

  /**
   * Get current performance tier
   */
  getPerformanceTier(): 'high' | 'medium' | 'low' {
    return this.performanceTier;
  }
}
```

### 2. Particle Field Background

```typescript
// apps/web/src/web/graphics/three/backgrounds/ParticleField.ts

import * as THREE from 'three';
import type { SceneLayer } from '../SceneManager';
import particleVertexShader from '../../shaders/particle.vert';
import particleFragmentShader from '../../shaders/particle.frag';

export interface ParticleFieldOptions {
  particleCount?: number;
  particleSize?: number;
  color?: THREE.Color;
  speed?: number;
  spread?: THREE.Vector3;
  mouseInfluence?: number;
}

export function createParticleField(
  options: ParticleFieldOptions = {}
): SceneLayer {
  const {
    particleCount = 2000,
    particleSize = 2,
    color = new THREE.Color(0x2081e2),
    speed = 0.3,
    spread = new THREE.Vector3(20, 20, 10),
    mouseInfluence = 0.5
  } = options;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 15;

  // Create particle geometry
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const alphas = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Random position within spread
    positions[i3] = (Math.random() - 0.5) * spread.x;
    positions[i3 + 1] = (Math.random() - 0.5) * spread.y;
    positions[i3 + 2] = (Math.random() - 0.5) * spread.z;

    // Random velocity
    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

    // Random size variation
    sizes[i] = particleSize * (0.5 + Math.random() * 0.5);

    // Random alpha for depth effect
    alphas[i] = 0.3 + Math.random() * 0.7;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  // Custom shader material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: color },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: mouseInfluence },
      uSpeed: { value: speed },
      uPixelRatio: { value: window.devicePixelRatio }
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Mouse tracking
  let mouseX = 0;
  let mouseY = 0;

  const handleMouseMove = (event: MouseEvent) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  window.addEventListener('mousemove', handleMouseMove);

  return {
    id: 'particle-field',
    scene,
    camera,
    renderOrder: 0, // Background layer

    update(deltaTime: number, elapsedTime: number) {
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uMouse.value.set(mouseX, mouseY);

      // Gentle rotation for depth effect
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
    },

    dispose() {
      window.removeEventListener('mousemove', handleMouseMove);
      geometry.dispose();
      material.dispose();
    }
  };
}
```

### 3. Particle Shaders

```glsl
// apps/web/src/web/graphics/shaders/particle.vert

uniform float uTime;
uniform float uSpeed;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uMouseInfluence;

attribute float size;
attribute float alpha;
attribute vec3 velocity;

varying float vAlpha;
varying float vDistance;

void main() {
  vec3 pos = position;

  // Apply velocity-based animation
  pos += velocity * uTime * uSpeed * 10.0;

  // Wrap around boundaries
  pos = mod(pos + 10.0, 20.0) - 10.0;

  // Mouse influence - particles push away from cursor
  vec2 toMouse = uMouse - pos.xy;
  float mouseDistance = length(toMouse);
  float mouseForce = smoothstep(3.0, 0.0, mouseDistance) * uMouseInfluence;
  pos.xy -= normalize(toMouse) * mouseForce * 0.5;

  // Wave motion
  pos.y += sin(uTime * 0.5 + pos.x * 0.5) * 0.1;
  pos.x += cos(uTime * 0.3 + pos.y * 0.5) * 0.1;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuation based on distance
  float sizeAttenuation = (300.0 / -mvPosition.z);
  gl_PointSize = size * sizeAttenuation * uPixelRatio;

  gl_Position = projectionMatrix * mvPosition;

  // Pass to fragment shader
  vAlpha = alpha;
  vDistance = -mvPosition.z;
}
```

```glsl
// apps/web/src/web/graphics/shaders/particle.frag

uniform vec3 uColor;
uniform float uTime;

varying float vAlpha;
varying float vDistance;

void main() {
  // Circular particle shape
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Soft edge falloff
  float alpha = smoothstep(0.5, 0.1, dist);

  // Depth-based fading
  float depthFade = smoothstep(20.0, 5.0, vDistance);

  // Pulsing glow
  float pulse = 0.8 + sin(uTime * 2.0 + vDistance * 0.5) * 0.2;

  // Final color with glow
  vec3 finalColor = uColor * (1.0 + pulse * 0.3);

  gl_FragColor = vec4(finalColor, alpha * vAlpha * depthFade);
}
```

### 4. Holographic Card Shader

```glsl
// apps/web/src/web/graphics/shaders/holographic.frag

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

// Noise function for holographic effect
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

void main() {
  vec2 uv = vUv;
  vec4 texColor = texture2D(uTexture, uv);

  // Calculate angle based on UV and mouse position
  vec2 center = uv - 0.5;
  float angle = atan(center.y, center.x);
  float dist = length(center);

  // Mouse-influenced tilt
  vec2 tilt = uMouse * 0.5;
  float tiltAngle = angle + tilt.x * 3.14159 + tilt.y * 3.14159;

  // Rainbow gradient based on angle and time
  float hue = fract(tiltAngle / 6.28318 + uTime * 0.1 + dist * 0.5);

  // HSV to RGB conversion
  vec3 rainbow = abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0;
  rainbow = clamp(rainbow, 0.0, 1.0);

  // Sparkle effect
  vec3 sparkle = hash33(vec3(uv * uResolution, uTime * 10.0));
  float sparkleIntensity = pow(max(sparkle.x, max(sparkle.y, sparkle.z)), 20.0);

  // Fresnel-like edge glow
  float fresnel = pow(1.0 - dot(vec2(0.5) - center, vec2(0.0, 1.0)), 2.0);

  // Combine effects
  vec3 holographic = rainbow * uIntensity * 0.3;
  holographic += sparkleIntensity * vec3(1.0) * uIntensity;
  holographic += fresnel * vec3(0.5, 0.7, 1.0) * uIntensity * 0.2;

  // Blend with original texture
  vec3 finalColor = texColor.rgb + holographic;

  gl_FragColor = vec4(finalColor, texColor.a);
}
```

---

## GSAP Animation System

### 1. GSAP Configuration

```typescript
// apps/web/src/web/motion/gsap-config.ts

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

// Register plugins
gsap.registerPlugin(ScrollTrigger, CustomEase);

// Create custom easing curves
CustomEase.create('nebula-spring', 'M0,0 C0.34,1.56 0.64,1 1,1');
CustomEase.create('nebula-expo-out', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create('nebula-bounce', 'M0,0 C0.68,-0.55 0.265,1.55 1,1');

// Global defaults
gsap.defaults({
  ease: 'nebula-expo-out',
  duration: 0.6
});

// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
);

if (prefersReducedMotion.matches) {
  gsap.globalTimeline.timeScale(0);
  gsap.defaults({ duration: 0 });
}

// Listen for preference changes
prefersReducedMotion.addEventListener('change', (e) => {
  if (e.matches) {
    gsap.globalTimeline.timeScale(0);
  } else {
    gsap.globalTimeline.timeScale(1);
  }
});

export { gsap, ScrollTrigger, CustomEase };
```

### 2. Page Transition Timeline

```typescript
// apps/web/src/web/motion/timelines/page-enter.ts

import { gsap } from '../gsap-config';

export interface PageEnterOptions {
  container: HTMLElement;
  header?: HTMLElement;
  content?: HTMLElement;
  sidebar?: HTMLElement;
  cards?: NodeListOf<Element> | Element[];
  onComplete?: () => void;
}

export function createPageEnterTimeline(
  options: PageEnterOptions
): gsap.core.Timeline {
  const { container, header, content, sidebar, cards, onComplete } = options;

  const tl = gsap.timeline({
    defaults: {
      ease: 'nebula-expo-out'
    },
    onComplete
  });

  // Initial states
  gsap.set(container, { opacity: 0 });

  if (header) {
    gsap.set(header, { y: -20, opacity: 0 });
  }

  if (sidebar) {
    gsap.set(sidebar, { x: -30, opacity: 0 });
  }

  if (content) {
    gsap.set(content, { y: 30, opacity: 0 });
  }

  if (cards && cards.length > 0) {
    gsap.set(cards, { y: 40, opacity: 0, scale: 0.95 });
  }

  // Animation sequence
  tl.to(container, {
    opacity: 1,
    duration: 0.3
  });

  if (header) {
    tl.to(
      header,
      {
        y: 0,
        opacity: 1,
        duration: 0.5
      },
      '-=0.1'
    );
  }

  if (sidebar) {
    tl.to(
      sidebar,
      {
        x: 0,
        opacity: 1,
        duration: 0.5
      },
      '-=0.3'
    );
  }

  if (content) {
    tl.to(
      content,
      {
        y: 0,
        opacity: 1,
        duration: 0.6
      },
      '-=0.4'
    );
  }

  if (cards && cards.length > 0) {
    tl.to(
      cards,
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: {
          amount: 0.4,
          from: 'start',
          grid: 'auto',
          ease: 'power2.out'
        }
      },
      '-=0.3'
    );
  }

  return tl;
}
```

### 3. Card Hover Animation Hook

```typescript
// apps/web/src/web/motion/hooks/useCardHover.ts

import { useRef, useEffect, useCallback } from 'react';
import { gsap } from '../gsap-config';

export interface UseCardHoverOptions {
  scale?: number;
  rotation?: number;
  shadow?: boolean;
  glow?: boolean;
  glowColor?: string;
  duration?: number;
}

export function useCardHover(options: UseCardHoverOptions = {}) {
  const {
    scale = 1.03,
    rotation = 2,
    shadow = true,
    glow = true,
    glowColor = 'rgba(32, 129, 226, 0.4)',
    duration = 0.3
  } = options;

  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);

  const handleMouseEnter = useCallback(
    (e: MouseEvent) => {
      if (!cardRef.current) return;
      isHovered.current = true;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();

      gsap.to(card, {
        scale,
        duration,
        ease: 'nebula-spring',
        boxShadow: shadow
          ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(32, 129, 226, 0.2)'
          : undefined
      });

      if (glow && glowRef.current) {
        gsap.to(glowRef.current, {
          opacity: 1,
          duration: duration * 0.5
        });
      }
    },
    [scale, shadow, glow, duration]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!cardRef.current || !isHovered.current) return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateX = (mouseY / rect.height) * -rotation;
      const rotateY = (mouseX / rect.width) * rotation;

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out'
      });

      // Update glow position
      if (glow && glowRef.current) {
        const glowX = ((e.clientX - rect.left) / rect.width) * 100;
        const glowY = ((e.clientY - rect.top) / rect.height) * 100;

        gsap.to(glowRef.current, {
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}, transparent 60%)`,
          duration: 0.1
        });
      }
    },
    [rotation, glow, glowColor]
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    isHovered.current = false;

    gsap.to(cardRef.current, {
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      duration,
      ease: 'nebula-expo-out'
    });

    if (glow && glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0,
        duration: duration * 0.5
      });
    }
  }, [duration, glow]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    // Set initial transform origin
    gsap.set(card, {
      transformPerspective: 1000,
      transformStyle: 'preserve-3d'
    });

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseEnter, handleMouseMove, handleMouseLeave]);

  return { cardRef, glowRef };
}
```

### 4. Stagger Animation Hook

```typescript
// apps/web/src/web/motion/hooks/useStagger.ts

import { useRef, useEffect, useCallback } from 'react';
import { gsap } from '../gsap-config';
import { useReducedMotion } from './useReducedMotion';

export interface UseStaggerOptions {
  staggerAmount?: number;
  from?: 'start' | 'end' | 'center' | 'edges' | 'random';
  y?: number;
  opacity?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  onComplete?: () => void;
}

export function useStagger<T extends HTMLElement>(
  options: UseStaggerOptions = {}
) {
  const {
    staggerAmount = 0.05,
    from = 'start',
    y = 30,
    opacity = 0,
    scale = 0.95,
    duration = 0.5,
    delay = 0,
    ease = 'nebula-expo-out',
    onComplete
  } = options;

  const containerRef = useRef<T>(null);
  const prefersReducedMotion = useReducedMotion();

  const animate = useCallback(
    (selector: string = '[data-stagger]') => {
      if (!containerRef.current) return;

      const elements = containerRef.current.querySelectorAll(selector);
      if (elements.length === 0) return;

      if (prefersReducedMotion) {
        gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
        onComplete?.();
        return;
      }

      // Set initial state
      gsap.set(elements, { opacity, y, scale });

      // Animate
      gsap.to(elements, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        delay,
        ease,
        stagger: {
          amount: staggerAmount,
          from,
          grid: 'auto'
        },
        onComplete
      });
    },
    [
      staggerAmount,
      from,
      y,
      opacity,
      scale,
      duration,
      delay,
      ease,
      onComplete,
      prefersReducedMotion
    ]
  );

  return { containerRef, animate };
}
```

---

## Component Updates

### 1. WebGLCanvas Component

```typescript
// apps/web/src/web/components/WebGLCanvas/WebGLCanvas.tsx

import { useEffect, useRef, useState } from 'react';
import { SceneManager } from '../../graphics/three/SceneManager';
import { createParticleField } from '../../graphics/three/backgrounds/ParticleField';
import { detectWebGLSupport } from '../../graphics/three/utils/webgl-detect';
import './WebGLCanvas.css';

export interface WebGLCanvasProps {
  className?: string;
  background?: 'particles' | 'gradient-mesh' | 'wave-grid' | 'none';
  intensity?: number;
  color?: string;
  fallbackGradient?: string;
}

export function WebGLCanvas({
  className = '',
  background = 'particles',
  intensity = 1,
  color = '#2081e2',
  fallbackGradient = 'linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)'
}: WebGLCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support
    if (!detectWebGLSupport()) {
      setWebglSupported(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize scene manager
    const sceneManager = new SceneManager({
      canvas,
      alpha: true,
      antialias: true
    });

    sceneManagerRef.current = sceneManager;

    // Add background layer based on prop
    if (background === 'particles') {
      const particleField = createParticleField({
        color: new THREE.Color(color),
        particleCount: sceneManager.getPerformanceTier() === 'low' ? 500 : 2000,
        mouseInfluence: intensity * 0.5
      });
      sceneManager.addLayer(particleField);
    }
    // ... other background types

    // Handle resize
    const handleResize = () => {
      if (canvas.parentElement) {
        sceneManager.resize(
          canvas.parentElement.clientWidth,
          canvas.parentElement.clientHeight
        );
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Start animation
    sceneManager.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneManager.dispose();
    };
  }, [background, intensity, color]);

  // Fallback for no WebGL support
  if (!webglSupported) {
    return (
      <div
        className={`webgl-canvas webgl-canvas--fallback ${className}`}
        style={{ background: fallbackGradient }}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`webgl-canvas ${className}`}
      aria-hidden="true"
    />
  );
}
```

```css
/* apps/web/src/web/components/WebGLCanvas/WebGLCanvas.css */

.webgl-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.webgl-canvas--fallback {
  background-size: cover;
  background-position: center;
}

/* Reduced motion: hide animated canvas */
@media (prefers-reduced-motion: reduce) {
  .webgl-canvas:not(.webgl-canvas--fallback) {
    display: none;
  }

  .webgl-canvas--fallback {
    display: block;
  }
}
```

### 2. Updated Card Component

```typescript
// apps/web/src/web/components/Card/Card.tsx (partial update)

import { useCardHover } from '../../motion/hooks/useCardHover';
import { useTheme } from '../../themes';
import './Card.css';

export function Card({ card, variant = 'grid', onClick }: CardProps) {
  const { theme } = useTheme();
  const { cardRef, glowRef } = useCardHover({
    scale: 1.03,
    rotation: 5,
    glow: theme === 'nebula',
    glowColor: getRarityGlowColor(card.rarity)
  });

  return (
    <div
      ref={cardRef}
      className={`pokemon-card pokemon-card--${variant} pokemon-card--${theme}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* Glow overlay for Nebula theme */}
      {theme === 'nebula' && (
        <div ref={glowRef} className="pokemon-card__glow" aria-hidden="true" />
      )}

      <div className="pokemon-card__image-container">
        <img
          src={card.images.small}
          alt={card.name}
          className="pokemon-card__image"
          loading="lazy"
        />

        {/* Holographic overlay for rare cards */}
        {theme === 'nebula' && isHolographicRarity(card.rarity) && (
          <div className="pokemon-card__holographic" aria-hidden="true" />
        )}
      </div>

      <div className="pokemon-card__content">
        {/* ... existing content ... */}
      </div>
    </div>
  );
}

function getRarityGlowColor(rarity: string): string {
  const glowColors: Record<string, string> = {
    'Rare Holo': 'rgba(123, 97, 255, 0.5)',
    'Rare Ultra': 'rgba(244, 114, 182, 0.5)',
    'Rare Secret': 'rgba(251, 191, 36, 0.5)',
    'default': 'rgba(32, 129, 226, 0.4)'
  };
  return glowColors[rarity] || glowColors.default;
}

function isHolographicRarity(rarity: string): boolean {
  return ['Rare Holo', 'Rare Ultra', 'Rare Secret', 'Rare Holo V', 'Rare Holo VMAX'].includes(rarity);
}
```

---

## Theme Provider & Switching

```typescript
// apps/web/src/web/themes/ThemeProvider.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeName = 'nebula' | 'catppuccin';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'pokemon-tcg-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'catppuccin' || stored === 'nebula') {
        return stored;
      }
    }
    // Default to new theme
    return 'nebula';
  });

  useEffect(() => {
    // Update document attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Persist preference
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Load theme CSS
    const themeLink = document.getElementById('theme-css') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = theme === 'nebula'
        ? '/css/nebula/variables.css'
        : '/css/index.legacy.css';
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'nebula' ? 'catppuccin' : 'nebula');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

**Duration:** 2 weeks | **Effort:** 40-50 hours

#### 1.1 Package Setup & Dependencies

**Tasks:**

- [ ] 1.1.1 Add three.js dependency (`three@^0.162.0`)
- [ ] 1.1.2 Add GSAP with plugins (`gsap@^3.12.0`)
- [ ] 1.1.3 Add @types/three for TypeScript
- [ ] 1.1.4 Configure Webpack for GLSL imports (raw-loader)
- [ ] 1.1.5 Set up shader file type declarations
- [ ] 1.1.6 Add web fonts (Inter, Plus Jakarta Sans, JetBrains Mono)

**Acceptance Criteria:**

- ✅ `bun install` completes without errors
- ✅ TypeScript recognizes three.js types
- ✅ GLSL files import as strings
- ✅ Fonts load without FOIT/FOUT

**Files to Modify:**

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/webpack.config.js`

#### 1.2 Theme Infrastructure

**Tasks:**

- [ ] 1.2.1 Create `/themes` directory structure
- [ ] 1.2.2 Extract current Catppuccin tokens to `catppuccin/tokens.ts`
- [ ] 1.2.3 Create `nebula/tokens.ts` with new design tokens
- [ ] 1.2.4 Build ThemeProvider with context
- [ ] 1.2.5 Add `data-theme` attribute switching
- [ ] 1.2.6 Create CSS variable mapping for both themes
- [ ] 1.2.7 Rename `index.css` → `index.legacy.css`
- [ ] 1.2.8 Create new `index.css` with theme imports

**Acceptance Criteria:**

- ✅ Theme switches without page reload
- ✅ CSS variables update when theme changes
- ✅ Theme persists in localStorage
- ✅ Both themes render correctly

**Files to Create:**

- `apps/web/src/web/themes/index.ts`
- `apps/web/src/web/themes/types.ts`
- `apps/web/src/web/themes/ThemeProvider.tsx`
- `apps/web/src/web/themes/catppuccin/index.ts`
- `apps/web/src/web/themes/catppuccin/tokens.ts`
- `apps/web/src/web/themes/nebula/index.ts`
- `apps/web/src/web/themes/nebula/tokens.ts`
- `apps/web/src/web/themes/nebula/nebula.css`

---

### Phase 2: WebGL System (Week 2-3)

**Duration:** 1.5 weeks | **Effort:** 35-45 hours

#### 2.1 Core Graphics Infrastructure

**Tasks:**

- [ ] 2.1.1 Create WebGL capability detection utility
- [ ] 2.1.2 Build performance tier detection (high/medium/low)
- [ ] 2.1.3 Implement SceneManager class
- [ ] 2.1.4 Create performance monitoring utility
- [ ] 2.1.5 Build resource disposal helpers
- [ ] 2.1.6 Add WebGLCanvas React component

**Acceptance Criteria:**

- ✅ WebGL detection works across browsers
- ✅ Performance tier adapts to device capability
- ✅ SceneManager handles lifecycle correctly
- ✅ No memory leaks on component unmount

**Files to Create:**

- `apps/web/src/web/graphics/index.ts`
- `apps/web/src/web/graphics/types.ts`
- `apps/web/src/web/graphics/three/index.ts`
- `apps/web/src/web/graphics/three/SceneManager.ts`
- `apps/web/src/web/graphics/three/utils/webgl-detect.ts`
- `apps/web/src/web/graphics/three/utils/performance.ts`
- `apps/web/src/web/graphics/three/utils/dispose.ts`
- `apps/web/src/web/components/WebGLCanvas/`

#### 2.2 Background Effects

**Tasks:**

- [ ] 2.2.1 Write particle vertex shader
- [ ] 2.2.2 Write particle fragment shader
- [ ] 2.2.3 Implement ParticleField background
- [ ] 2.2.4 Add mouse interaction to particles
- [ ] 2.2.5 Implement adaptive particle count
- [ ] 2.2.6 Add gradient fallback for no-WebGL

**Acceptance Criteria:**

- ✅ Particles animate smoothly at 60fps
- ✅ Mouse pushes particles away
- ✅ Low-end devices get reduced particle count
- ✅ Fallback gradient displays without WebGL

**Files to Create:**

- `apps/web/src/web/graphics/shaders/particle.vert`
- `apps/web/src/web/graphics/shaders/particle.frag`
- `apps/web/src/web/graphics/three/backgrounds/ParticleField.ts`

#### 2.3 Card Shader Effects

**Tasks:**

- [ ] 2.3.1 Write holographic card shader
- [ ] 2.3.2 Implement glow effect shader
- [ ] 2.3.3 Create CardShaderOverlay component
- [ ] 2.3.4 Integrate with Card component
- [ ] 2.3.5 Add rarity-based effect selection

**Acceptance Criteria:**

- ✅ Holographic effect responds to mouse movement
- ✅ Glow color matches card rarity
- ✅ Effects only apply in Nebula theme
- ✅ Performance acceptable on mid-tier devices

**Files to Create:**

- `apps/web/src/web/graphics/shaders/holographic.vert`
- `apps/web/src/web/graphics/shaders/holographic.frag`
- `apps/web/src/web/graphics/shaders/glow.frag`
- `apps/web/src/web/graphics/three/effects/CardHolographic.ts`

---

### Phase 3: GSAP Animation System (Week 3-4)

**Duration:** 1 week | **Effort:** 25-35 hours

#### 3.1 GSAP Configuration

**Tasks:**

- [ ] 3.1.1 Configure GSAP with plugins
- [ ] 3.1.2 Create custom easing curves
- [ ] 3.1.3 Set up global defaults
- [ ] 3.1.4 Implement reduced-motion detection
- [ ] 3.1.5 Create useReducedMotion hook

**Acceptance Criteria:**

- ✅ GSAP plugins registered correctly
- ✅ Custom easings available globally
- ✅ Reduced motion disables animations

**Files to Create:**

- `apps/web/src/web/motion/index.ts`
- `apps/web/src/web/motion/types.ts`
- `apps/web/src/web/motion/gsap-config.ts`
- `apps/web/src/web/motion/hooks/useReducedMotion.ts`

#### 3.2 Animation Hooks

**Tasks:**

- [ ] 3.2.1 Create useGsapTimeline hook
- [ ] 3.2.2 Create useScrollTrigger hook
- [ ] 3.2.3 Create useStagger hook
- [ ] 3.2.4 Create useCardHover hook
- [ ] 3.2.5 Document hook usage patterns

**Acceptance Criteria:**

- ✅ Hooks clean up timelines on unmount
- ✅ ScrollTrigger works with SSR
- ✅ Stagger animates grid items correctly

**Files to Create:**

- `apps/web/src/web/motion/hooks/index.ts`
- `apps/web/src/web/motion/hooks/useGsapTimeline.ts`
- `apps/web/src/web/motion/hooks/useScrollTrigger.ts`
- `apps/web/src/web/motion/hooks/useStagger.ts`

#### 3.3 Page Transitions

**Tasks:**

- [ ] 3.3.1 Create page enter timeline
- [ ] 3.3.2 Create page exit timeline
- [ ] 3.3.3 Build TransitionProvider
- [ ] 3.3.4 Create RouteTransition wrapper
- [ ] 3.3.5 Integrate with router

**Acceptance Criteria:**

- ✅ Pages animate in/out smoothly
- ✅ Route changes trigger transitions
- ✅ Works with browser back/forward

**Files to Create:**

- `apps/web/src/web/motion/timelines/page-enter.ts`
- `apps/web/src/web/motion/timelines/page-exit.ts`
- `apps/web/src/web/motion/transitions/TransitionProvider.tsx`
- `apps/web/src/web/motion/transitions/RouteTransition.tsx`

---

### Phase 4: Component Migration (Week 4-5)

**Duration:** 1.5 weeks | **Effort:** 40-50 hours

#### 4.1 Core Component Updates

**Tasks:**

- [ ] 4.1.1 Update Card component with theme support
- [ ] 4.1.2 Update Button component styles
- [ ] 4.1.3 Update Badge component styles
- [ ] 4.1.4 Update Modal with GSAP transitions
- [ ] 4.1.5 Update Navbar with glassmorphism
- [ ] 4.1.6 Update Sidebar with new styling
- [ ] 4.1.7 Create ThemeToggle component

**Acceptance Criteria:**

- ✅ Components render correctly in both themes
- ✅ Animations are smooth and purposeful
- ✅ Theme toggle is accessible

**Files to Modify:**

- `apps/web/src/web/components/Card/Card.tsx`
- `apps/web/src/web/components/Card/Card.css`
- `apps/web/src/web/components/Button/Button.css`
- `apps/web/src/web/components/Badge/Badge.css`
- `apps/web/src/web/components/Modal/Modal.tsx`
- `apps/web/src/web/components/Modal/Modal.css`
- `apps/web/src/web/components/Navbar/Navbar.css`
- `apps/web/src/web/components/AppSidebar/AppSidebar.css`

**Files to Create:**

- `apps/web/src/web/components/ThemeToggle/`

#### 4.2 Page Updates

**Tasks:**

- [ ] 4.2.1 Add WebGL background to DashboardPage
- [ ] 4.2.2 Update BrowsePage with stagger animations
- [ ] 4.2.3 Update CollectionPage styling
- [ ] 4.2.4 Update DecksPage card animations
- [ ] 4.2.5 Update DeckBuilderPage layout

**Acceptance Criteria:**

- ✅ Pages feel premium and polished
- ✅ Animations enhance UX
- ✅ Performance remains acceptable

**Files to Modify:**

- `apps/web/src/web/pages/DashboardPage.tsx`
- `apps/web/src/web/pages/BrowsePage.tsx`
- `apps/web/src/web/pages/CollectionPage.tsx`
- `apps/web/src/web/pages/DecksPage.tsx`
- `apps/web/src/web/pages/DeckBuilderPage.tsx`

---

### Phase 5: Testing & Polish (Week 5-6)

**Duration:** 1 week | **Effort:** 25-30 hours

#### 5.1 Performance Testing

**Tasks:**

- [ ] 5.1.1 Profile WebGL performance across devices
- [ ] 5.1.2 Test animation frame rates
- [ ] 5.1.3 Measure memory usage
- [ ] 5.1.4 Test on low-end devices
- [ ] 5.1.5 Optimize shader complexity if needed

**Acceptance Criteria:**

- ✅ 60fps on high-tier devices
- ✅ 30fps minimum on low-tier devices
- ✅ No memory leaks
- ✅ Graceful degradation works

#### 5.2 Accessibility Testing

**Tasks:**

- [ ] 5.2.1 Test with screen readers
- [ ] 5.2.2 Verify reduced-motion support
- [ ] 5.2.3 Check color contrast ratios
- [ ] 5.2.4 Test keyboard navigation
- [ ] 5.2.5 Audit with Lighthouse

**Acceptance Criteria:**

- ✅ WCAG 2.1 AA compliance
- ✅ Animations respect prefers-reduced-motion
- ✅ All interactive elements keyboard accessible

#### 5.3 Cross-Browser Testing

**Tasks:**

- [ ] 5.3.1 Test Chrome/Edge
- [ ] 5.3.2 Test Firefox
- [ ] 5.3.3 Test Safari
- [ ] 5.3.4 Test mobile browsers
- [ ] 5.3.5 Fix browser-specific issues

**Acceptance Criteria:**

- ✅ Consistent appearance across browsers
- ✅ WebGL works or falls back gracefully
- ✅ Animations perform similarly

---

## Deprecation Strategy

### Catppuccin Theme Deprecation Timeline

| Phase       | Action                                   | Timeline |
| ----------- | ---------------------------------------- | -------- |
| **Phase 1** | Mark as "Legacy" in code comments        | Week 1   |
| **Phase 2** | Add deprecation notice in ThemeToggle UI | Week 4   |
| **Phase 3** | Default new users to Nebula theme        | Week 6   |
| **Phase 4** | Log analytics on theme usage             | Month 2  |
| **Phase 5** | If <5% usage, plan removal               | Month 4  |
| **Phase 6** | Remove Catppuccin theme entirely         | Month 6+ |

### Deprecation Markers

```typescript
// apps/web/src/web/themes/catppuccin/index.ts

/**
 * @deprecated The Catppuccin Mocha theme is deprecated and will be removed
 * in a future version. Please migrate to the Nebula theme.
 *
 * Removal target: v2.0.0 (estimated Month 6)
 * Migration guide: docs/THEME_MIGRATION.md
 */
export const catppuccin = {
  // ...
};
```

```css
/* apps/web/public/css/index.legacy.css */

/**
 * DEPRECATED: Catppuccin Mocha Theme
 *
 * This theme is deprecated and will be removed in v2.0.0.
 * The Nebula theme is now the default.
 *
 * To migrate:
 * 1. Update data-theme="catppuccin" to data-theme="nebula"
 * 2. Review component-specific style overrides
 * 3. Test for visual regressions
 *
 * @deprecated
 */
```

---

## Success Criteria

| Criteria            | Metric                        | Target      |
| ------------------- | ----------------------------- | ----------- |
| **Performance**     | Lighthouse Performance Score  | ≥85         |
| **Performance**     | WebGL FPS (high-tier)         | ≥55         |
| **Performance**     | WebGL FPS (low-tier)          | ≥25         |
| **Performance**     | Time to Interactive           | <3s         |
| **Accessibility**   | WCAG Compliance               | AA          |
| **Accessibility**   | Lighthouse Accessibility      | ≥90         |
| **Browser Support** | Chrome, Firefox, Safari, Edge | Full        |
| **Mobile**          | iOS Safari, Chrome Android    | Full        |
| **Bundle Size**     | three.js chunk                | <200KB gzip |
| **Bundle Size**     | GSAP chunk                    | <50KB gzip  |
| **Theme Adoption**  | Users on Nebula (Month 2)     | >70%        |

---

## Dependencies

```json
{
  "dependencies": {
    "three": "^0.162.0",
    "gsap": "^3.12.5"
  },
  "devDependencies": {
    "@types/three": "^0.162.0",
    "raw-loader": "^4.0.2"
  }
}
```

---

## Risk Mitigation

### High-Risk Items

1. **WebGL Performance on Mobile**
   - _Risk:_ Mobile GPUs may struggle with particle systems
   - _Mitigation:_ Aggressive quality reduction, particle count caps, disable on low-end

2. **Bundle Size Increase**
   - _Risk:_ three.js adds ~150KB gzipped
   - _Mitigation:_ Code splitting, dynamic imports, tree shaking

3. **SSR Compatibility**
   - _Risk:_ three.js requires DOM, breaks SSR
   - _Mitigation:_ Dynamic imports, typeof window checks, hydration-safe patterns

### Medium-Risk Items

1. **Theme Migration Confusion**
   - _Risk:_ Users attached to Catppuccin may resist change
   - _Mitigation:_ Optional toggle, gradual rollout, clear communication

2. **Animation Overload**
   - _Risk:_ Too many animations feel chaotic
   - _Mitigation:_ Purposeful motion, reduced-motion support, user preference setting

---

## Implementation Summary

| Phase                   | Duration    | Effort       | Key Deliverables                     |
| ----------------------- | ----------- | ------------ | ------------------------------------ |
| **Phase 1: Foundation** | 2 weeks     | 40-50h       | Theme system, dependencies           |
| **Phase 2: WebGL**      | 1.5 weeks   | 35-45h       | SceneManager, particle background    |
| **Phase 3: GSAP**       | 1 week      | 25-35h       | Animation hooks, page transitions    |
| **Phase 4: Components** | 1.5 weeks   | 40-50h       | Updated components, pages            |
| **Phase 5: Testing**    | 1 week      | 25-30h       | Performance, accessibility, browsers |
| **TOTAL**               | **7 weeks** | **165-210h** |                                      |

---

## Questions for Clarification

1. **Mobile Priority:** Should WebGL effects be disabled entirely on mobile, or reduced quality?
2. **Theme Preference:** Should Nebula be the default immediately, or after a trial period?
3. **Font Loading:** Use Google Fonts CDN or self-hosted fonts?
4. **Analytics:** Track theme usage to inform deprecation timeline?
5. **Shader Complexity:** Prioritize visual fidelity or maximum device compatibility?

---

## Next Steps

1. **Review and approve this specification**
2. **Begin Phase 1.1** - Package setup and dependencies
3. **Set up branch:** `feature/nebula-theme-migration`
4. **Establish milestone checkpoints** for each phase
