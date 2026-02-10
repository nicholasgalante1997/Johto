import * as THREE from 'three';
import type { SceneLayerConfig, PerformanceTier } from '../types';
import {
  getPerformanceTier,
  getRecommendedPixelRatio,
  QualityManager,
  disposeRenderer
} from '../utils';

export interface SceneManagerOptions {
  canvas: HTMLCanvasElement;
  backgroundColor?: number;
  backgroundAlpha?: number;
  antialias?: boolean;
  alpha?: boolean;
  pixelRatio?: number;
  maxPixelRatio?: number;
  adaptiveQuality?: boolean;
}

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private layers: Map<string, SceneLayerConfig> = new Map();
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private qualityManager: QualityManager | null = null;
  private performanceTier: PerformanceTier;
  private resizeObserver: ResizeObserver | null = null;
  private canvas: HTMLCanvasElement;

  constructor(options: SceneManagerOptions) {
    const {
      canvas,
      backgroundColor = 0x0a0a0f,
      backgroundAlpha = 0,
      antialias = true,
      alpha = true,
      pixelRatio,
      maxPixelRatio = 2,
      adaptiveQuality = true
    } = options;

    this.canvas = canvas;
    this.performanceTier = getPerformanceTier();

    // Determine pixel ratio
    const recommendedRatio = getRecommendedPixelRatio(this.performanceTier);
    const finalPixelRatio = Math.min(
      pixelRatio ?? recommendedRatio,
      maxPixelRatio
    );

    // Initialize renderer with performance-appropriate settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.performanceTier !== 'low' && antialias,
      alpha,
      powerPreference:
        this.performanceTier === 'high' ? 'high-performance' : 'default',
      stencil: false,
      depth: true
    });

    this.renderer.setPixelRatio(finalPixelRatio);
    this.renderer.setClearColor(backgroundColor, backgroundAlpha);
    this.renderer.autoClear = false;

    // Initialize clock
    this.clock = new THREE.Clock(false);

    // Set up adaptive quality if enabled
    if (adaptiveQuality) {
      this.qualityManager = new QualityManager(this.performanceTier);
    }

    // Set initial size
    this.updateSize();

    // Set up resize observer
    this.setupResizeObserver();
  }

  /**
   * Set up resize observer for responsive canvas
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      this.updateSize();
    });

    // Observe the canvas parent
    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  /**
   * Update renderer size based on container
   */
  private updateSize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    if (width === 0 || height === 0) return;

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
   * Add a rendering layer (background, effects, etc.)
   */
  addLayer(config: SceneLayerConfig): void {
    this.layers.set(config.id, config);
  }

  /**
   * Remove a layer by ID
   */
  removeLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.dispose?.();
      this.layers.delete(id);
    }
  }

  /**
   * Get a layer by ID
   */
  getLayer(id: string): SceneLayerConfig | undefined {
    return this.layers.get(id);
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
    this.clock.stop();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    // Performance monitoring
    this.qualityManager?.beginFrame();

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Clear the canvas
    this.renderer.clear();

    // Sort layers by render order and render each
    const sortedLayers = Array.from(this.layers.values()).sort(
      (a, b) => a.renderOrder - b.renderOrder
    );

    for (const layer of sortedLayers) {
      layer.update?.(deltaTime, elapsedTime);
      this.renderer.render(layer.scene, layer.camera);
    }

    // Check for quality adjustment
    if (this.qualityManager) {
      const newTier = this.qualityManager.endFrame();
      if (newTier !== this.performanceTier) {
        this.performanceTier = newTier;
        this.onPerformanceTierChange(newTier);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Handle performance tier changes
   */
  private onPerformanceTierChange(newTier: PerformanceTier): void {
    // Adjust pixel ratio
    const newRatio = getRecommendedPixelRatio(newTier);
    this.renderer.setPixelRatio(newRatio);

    // Notify layers of performance change (they can adjust particle counts, etc.)
    // This could be expanded to emit events for layers to handle
    console.log(`[SceneManager] Performance tier changed to: ${newTier}`);
  }

  /**
   * Force resize update
   */
  resize(): void {
    this.updateSize();
  }

  /**
   * Get current performance tier
   */
  getPerformanceTier(): PerformanceTier {
    return this.performanceTier;
  }

  /**
   * Get current FPS (if quality manager is active)
   */
  getFps(): number {
    return this.qualityManager?.getFps() ?? 60;
  }

  /**
   * Get the three.js renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stop();

    // Dispose all layers
    this.layers.forEach((layer) => layer.dispose?.());
    this.layers.clear();

    // Disconnect resize observer
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Dispose renderer
    disposeRenderer(this.renderer);
  }
}
