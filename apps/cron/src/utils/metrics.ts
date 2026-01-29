import type { MetricsCollector } from '../scheduler/types';

/**
 * Implementation of MetricsCollector that stores metrics in memory.
 */
export class MetricsCollectorImpl implements MetricsCollector {
  private metrics: Map<string, number> = new Map();

  /**
   * Increment a counter metric by the specified value (default: 1).
   */
  increment(name: string, value: number = 1): void {
    const current = this.metrics.get(name) ?? 0;
    this.metrics.set(name, current + value);
  }

  /**
   * Set a gauge metric to a specific value.
   */
  gauge(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  /**
   * Record a timing metric in milliseconds.
   * Automatically appends '_ms' suffix to the metric name.
   */
  timing(name: string, durationMs: number): void {
    this.metrics.set(`${name}_ms`, durationMs);
  }

  /**
   * Get all collected metrics as a plain object.
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Reset all collected metrics.
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Get a specific metric value.
   */
  get(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Check if a metric exists.
   */
  has(name: string): boolean {
    return this.metrics.has(name);
  }
}
