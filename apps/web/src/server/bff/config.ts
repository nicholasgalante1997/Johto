/**
 * BFF Configuration
 */
export interface BffConfig {
  restApiUrl: string;
  graphqlApiUrl: string;
  cache: {
    ttlSeconds: number;
    maxSize: number;
  };
  circuitBreaker: {
    threshold: number;
    timeoutMs: number;
  };
  timeout: number;
}

export function loadBffConfig(): BffConfig {
  return {
    restApiUrl: process.env.REST_API_URL || 'http://localhost:3001',
    graphqlApiUrl: process.env.GRAPHQL_API_URL || 'http://localhost:3002',
    cache: {
      ttlSeconds: parseInt(process.env.BFF_CACHE_TTL_SECONDS || '300', 10),
      maxSize: parseInt(process.env.BFF_CACHE_MAX_SIZE || '1000', 10)
    },
    circuitBreaker: {
      threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
      timeoutMs: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || '30000', 10)
    },
    timeout: parseInt(process.env.BFF_TIMEOUT_MS || '10000', 10)
  };
}

export const bffConfig = loadBffConfig();
