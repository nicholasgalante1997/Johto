import { bffConfig } from './config';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  lastSuccess: number;
}

/**
 * Simple Circuit Breaker implementation
 * Prevents cascading failures by stopping calls to failing services
 */
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private threshold: number;
  private timeoutMs: number;
  private name: string;

  constructor(name: string, threshold?: number, timeoutMs?: number) {
    this.name = name;
    this.threshold = threshold || bffConfig.circuitBreaker.threshold;
    this.timeoutMs = timeoutMs || bffConfig.circuitBreaker.timeoutMs;
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: 0,
      lastSuccess: Date.now()
    };
  }

  /**
   * Check if the circuit is open (calls should not be made)
   */
  isOpen(): boolean {
    if (this.state.state === 'OPEN') {
      // Check if we should transition to half-open
      if (Date.now() - this.state.lastFailure >= this.timeoutMs) {
        this.state.state = 'HALF_OPEN';
        console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      console.log(
        `[CircuitBreaker:${this.name}] Call succeeded, closing circuit`
      );
    }
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: this.state.lastFailure,
      lastSuccess: Date.now()
    };
  }

  /**
   * Record a failed call
   */
  recordFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.threshold) {
      console.log(
        `[CircuitBreaker:${this.name}] Failure threshold reached (${this.state.failures}/${this.threshold}), opening circuit`
      );
      this.state.state = 'OPEN';
    } else if (this.state.state === 'HALF_OPEN') {
      console.log(
        `[CircuitBreaker:${this.name}] Call failed in HALF_OPEN, reopening circuit`
      );
      this.state.state = 'OPEN';
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state.state;
  }

  /**
   * Get statistics
   */
  getStats(): {
    name: string;
    state: CircuitState;
    failures: number;
    threshold: number;
    lastFailure: string | null;
    lastSuccess: string;
  } {
    return {
      name: this.name,
      state: this.state.state,
      failures: this.state.failures,
      threshold: this.threshold,
      lastFailure: this.state.lastFailure
        ? new Date(this.state.lastFailure).toISOString()
        : null,
      lastSuccess: new Date(this.state.lastSuccess).toISOString()
    };
  }
}

// Singleton circuit breakers for each service
export const restApiCircuit = new CircuitBreaker('rest-api');
export const graphqlApiCircuit = new CircuitBreaker('graphql-api');

/**
 * Execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  circuit: CircuitBreaker,
  fn: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  if (circuit.isOpen()) {
    if (fallback) {
      console.log(
        `[CircuitBreaker:${circuit.getState()}] Circuit open, using fallback`
      );
      return fallback();
    }
    throw new Error(`Circuit breaker is open for service`);
  }

  try {
    const result = await fn();
    circuit.recordSuccess();
    return result;
  } catch (error) {
    circuit.recordFailure();
    if (fallback) {
      return fallback();
    }
    throw error;
  }
}
