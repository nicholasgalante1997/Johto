import type { PerformanceTier } from '../types';

/**
 * FPS Monitor for adaptive quality
 */
export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 60;
  private readonly sampleSize: number;
  private readonly targetFps: number;
  private readonly lowFpsThreshold: number;

  constructor(
    options: {
      sampleSize?: number;
      targetFps?: number;
      lowFpsThreshold?: number;
    } = {}
  ) {
    this.sampleSize = options.sampleSize ?? 60;
    this.targetFps = options.targetFps ?? 60;
    this.lowFpsThreshold = options.lowFpsThreshold ?? 30;
  }

  /**
   * Call at the start of each frame
   */
  begin(): void {
    this.lastTime = performance.now();
  }

  /**
   * Call at the end of each frame
   */
  end(): void {
    const now = performance.now();
    const frameTime = now - this.lastTime;
    const fps = 1000 / frameTime;

    this.frames.push(fps);
    this.frameCount++;

    // Keep only recent samples
    if (this.frames.length > this.sampleSize) {
      this.frames.shift();
    }

    // Update current FPS average
    if (this.frames.length >= 10) {
      this.currentFps =
        this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    }
  }

  /**
   * Get current average FPS
   */
  getFps(): number {
    return Math.round(this.currentFps);
  }

  /**
   * Check if quality should be reduced
   */
  shouldReduceQuality(): boolean {
    // Need enough samples
    if (this.frames.length < 30) return false;

    // Check if consistently below threshold
    return this.currentFps < this.lowFpsThreshold;
  }

  /**
   * Check if quality can be increased
   */
  canIncreaseQuality(): boolean {
    if (this.frames.length < 60) return false;

    // If running well above target, can increase
    return this.currentFps > this.targetFps * 0.9;
  }

  /**
   * Reset the monitor
   */
  reset(): void {
    this.frames = [];
    this.frameCount = 0;
    this.currentFps = 60;
  }

  /**
   * Get frame count since last reset
   */
  getFrameCount(): number {
    return this.frameCount;
  }
}

/**
 * Quality level manager for adaptive rendering
 */
export class QualityManager {
  private currentTier: PerformanceTier;
  private monitor: PerformanceMonitor;
  private reductionCount: number = 0;
  private lastAdjustmentFrame: number = 0;
  private readonly adjustmentCooldown: number = 120; // frames

  constructor(initialTier: PerformanceTier) {
    this.currentTier = initialTier;
    this.monitor = new PerformanceMonitor();
  }

  /**
   * Begin frame timing
   */
  beginFrame(): void {
    this.monitor.begin();
  }

  /**
   * End frame timing and check for quality adjustments
   */
  endFrame(): PerformanceTier {
    this.monitor.end();

    const frameCount = this.monitor.getFrameCount();

    // Don't adjust too frequently
    if (frameCount - this.lastAdjustmentFrame < this.adjustmentCooldown) {
      return this.currentTier;
    }

    // Check if we need to reduce quality
    if (this.monitor.shouldReduceQuality() && this.currentTier !== 'low') {
      this.lastAdjustmentFrame = frameCount;
      this.reductionCount++;
      this.currentTier = this.currentTier === 'high' ? 'medium' : 'low';
    }

    return this.currentTier;
  }

  /**
   * Get current quality tier
   */
  getTier(): PerformanceTier {
    return this.currentTier;
  }

  /**
   * Get current FPS
   */
  getFps(): number {
    return this.monitor.getFps();
  }

  /**
   * Force a specific tier
   */
  setTier(tier: PerformanceTier): void {
    this.currentTier = tier;
    this.monitor.reset();
  }
}

/**
 * Throttle function execution to target FPS
 */
export function createFrameThrottler(targetFps: number = 60) {
  const frameInterval = 1000 / targetFps;
  let lastFrameTime = 0;

  return function shouldRenderFrame(currentTime: number): boolean {
    const elapsed = currentTime - lastFrameTime;

    if (elapsed >= frameInterval) {
      lastFrameTime = currentTime - (elapsed % frameInterval);
      return true;
    }

    return false;
  };
}
