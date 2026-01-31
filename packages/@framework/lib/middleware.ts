/**
 * @fileoverview Built-in middleware for common HTTP concerns.
 * All middleware follows the standard Middleware signature.
 */

import type { Middleware, Context } from './types';

// ============================================================
// CORS Middleware
// ============================================================

/**
 * CORS (Cross-Origin Resource Sharing) middleware options
 */
export interface CorsOptions {
  /**
   * Allowed origins. Use '*' for any origin, or specify exact origins.
   * @default '*'
   */
  origins?: string | string[];

  /**
   * Allowed HTTP methods.
   * @default ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
   */
  methods?: string[];

  /**
   * Allowed request headers.
   * @default ['Content-Type', 'Authorization', 'X-Request-ID']
   */
  headers?: string[];

  /**
   * Headers exposed to the browser.
   * @default ['X-Request-ID']
   */
  exposeHeaders?: string[];

  /**
   * Allow credentials (cookies, authorization headers).
   * @default false
   */
  credentials?: boolean;

  /**
   * Preflight cache max age in seconds.
   * @default 86400 (24 hours)
   */
  maxAge?: number;
}

/**
 * Create CORS middleware.
 *
 * Handles preflight OPTIONS requests and adds CORS headers to responses.
 *
 * @param options - CORS configuration
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Allow all origins
 * app.use(cors());
 *
 * // Allow specific origins
 * app.use(cors({
 *   origins: ['http://localhost:3000', 'https://app.example.com'],
 *   credentials: true
 * }));
 * ```
 */
export function cors(options: CorsOptions = {}): Middleware {
  const {
    origins = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders = ['X-Request-ID'],
    credentials = false,
    maxAge = 86400
  } = options;

  const allowedOrigins = Array.isArray(origins) ? origins : [origins];
  const methodsStr = methods.join(', ');
  const headersStr = headers.join(', ');
  const exposeStr = exposeHeaders.join(', ');

  /**
   * Check if origin is allowed
   */
  function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false;
    if (allowedOrigins.includes('*')) return true;
    return allowedOrigins.includes(origin);
  }

  return async (ctx, next) => {
    const origin = ctx.headers.get('origin');
    const isAllowed = isOriginAllowed(origin);

    // Handle preflight OPTIONS request
    if (ctx.method === 'OPTIONS') {
      const responseHeaders: Record<string, string> = {
        'access-control-allow-methods': methodsStr,
        'access-control-allow-headers': headersStr,
        'access-control-max-age': String(maxAge)
      };

      if (isAllowed && origin) {
        responseHeaders['access-control-allow-origin'] = origin;
      }

      if (credentials) {
        responseHeaders['access-control-allow-credentials'] = 'true';
      }

      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }

    // Process request
    const response = await next();

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);

    if (isAllowed && origin) {
      newHeaders.set('access-control-allow-origin', origin);
      newHeaders.set('access-control-expose-headers', exposeStr);

      if (credentials) {
        newHeaders.set('access-control-allow-credentials', 'true');
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}

// ============================================================
// Logging Middleware
// ============================================================

/**
 * Request logging middleware.
 *
 * Logs incoming requests and outgoing responses with timing.
 *
 * @example
 * ```typescript
 * app.use(logging);
 *
 * // Output:
 * // --> GET /api/v1/cards
 * // <-- GET /api/v1/cards 200 12ms
 * ```
 */
export const logging: Middleware = async (ctx, next) => {
  console.log(`--> ${ctx.method} ${ctx.path}`);

  const response = await next();

  const duration = Date.now() - ctx.startTime;
  console.log(`<-- ${ctx.method} ${ctx.path} ${response.status} ${duration}ms`);

  return response;
};

/**
 * Logging middleware options
 */
export interface LoggingOptions {
  /**
   * Custom log function.
   * @default console.log
   */
  logger?: (message: string) => void;

  /**
   * Skip logging for certain paths.
   * @example ['/health', '/ready']
   */
  skip?: string[];
}

/**
 * Create configurable logging middleware.
 *
 * @param options - Logging options
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * app.use(createLogging({
 *   skip: ['/health', '/ready'],
 *   logger: (msg) => myLogger.info(msg)
 * }));
 * ```
 */
export function createLogging(options: LoggingOptions = {}): Middleware {
  const {
    logger = console.log,
    skip = []
  } = options;

  return async (ctx, next) => {
    // Skip logging for specified paths
    if (skip.includes(ctx.path)) {
      return next();
    }

    logger(`--> ${ctx.method} ${ctx.path}`);

    const response = await next();

    const duration = Date.now() - ctx.startTime;
    logger(`<-- ${ctx.method} ${ctx.path} ${response.status} ${duration}ms`);

    return response;
  };
}

// ============================================================
// Rate Limiting Middleware
// ============================================================

/**
 * Rate limiting middleware options
 */
export interface RateLimitOptions {
  /**
   * Time window in milliseconds.
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Maximum requests per window.
   * @default 100
   */
  max?: number;

  /**
   * Function to generate a unique key for each client.
   * @default Uses X-Forwarded-For header or 'global'
   */
  keyGenerator?: (ctx: Context) => string;

  /**
   * Custom response when rate limited.
   */
  handler?: (ctx: Context, retryAfter: number) => Response;
}

/**
 * Create rate limiting middleware.
 *
 * Uses an in-memory store to track request counts per client.
 * For production with multiple instances, use Redis or similar.
 *
 * @param options - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // 1000 requests per minute
 * app.use(rateLimit({ windowMs: 60000, max: 1000 }));
 *
 * // Custom key generator (by API key)
 * app.use(rateLimit({
 *   max: 100,
 *   keyGenerator: (ctx) => ctx.headers.get('x-api-key') || 'anonymous'
 * }));
 * ```
 */
export function rateLimit(options: RateLimitOptions = {}): Middleware {
  const {
    windowMs = 60000,
    max = 100,
    keyGenerator = defaultKeyGenerator,
    handler = defaultRateLimitHandler
  } = options;

  /** Request count tracking */
  const hits = new Map<string, { count: number; resetTime: number }>();

  // Cleanup expired entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits) {
      if (now > value.resetTime) {
        hits.delete(key);
      }
    }
  }, windowMs);

  // Don't block process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return async (ctx, next) => {
    const key = keyGenerator(ctx);
    const now = Date.now();

    let record = hits.get(key);

    // Create new record if none exists or window expired
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      hits.set(key, record);
    }

    record.count++;

    // Check if over limit
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return handler(ctx, retryAfter);
    }

    // Process request
    const response = await next();

    // Add rate limit headers
    const headers = new Headers(response.headers);
    headers.set('x-ratelimit-limit', String(max));
    headers.set('x-ratelimit-remaining', String(Math.max(0, max - record.count)));
    headers.set('x-ratelimit-reset', String(Math.ceil(record.resetTime / 1000)));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };
}

/**
 * Default key generator - uses X-Forwarded-For or X-Real-IP
 */
function defaultKeyGenerator(ctx: Context): string {
  return (
    ctx.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    ctx.headers.get('x-real-ip') ||
    'global'
  );
}

/**
 * Default rate limit exceeded handler
 */
function defaultRateLimitHandler(ctx: Context, retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        status: 429
      }
    }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(retryAfter),
        'x-request-id': ctx.requestId
      }
    }
  );
}

// ============================================================
// Security Headers Middleware
// ============================================================

/**
 * Security headers middleware.
 *
 * Adds common security headers to responses.
 *
 * @example
 * ```typescript
 * app.use(securityHeaders);
 * ```
 */
export const securityHeaders: Middleware = async (ctx, next) => {
  const response = await next();

  const headers = new Headers(response.headers);

  // Prevent MIME type sniffing
  headers.set('x-content-type-options', 'nosniff');

  // Prevent clickjacking
  headers.set('x-frame-options', 'DENY');

  // XSS protection (legacy, but still useful)
  headers.set('x-xss-protection', '1; mode=block');

  // Referrer policy
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

// ============================================================
// Request ID Middleware
// ============================================================

/**
 * Request ID middleware.
 *
 * Ensures every response has an X-Request-ID header.
 * Uses existing header from request or generates a new one.
 *
 * Note: The context already handles this, but this middleware
 * ensures it's consistently added even for error responses.
 *
 * @example
 * ```typescript
 * app.use(requestId);
 * ```
 */
export const requestId: Middleware = async (ctx, next) => {
  const response = await next();

  // Ensure request ID is in response
  if (!response.headers.has('x-request-id')) {
    const headers = new Headers(response.headers);
    headers.set('x-request-id', ctx.requestId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  return response;
};

// ============================================================
// Timing Middleware
// ============================================================

/**
 * Server timing middleware.
 *
 * Adds Server-Timing header with request duration.
 * Useful for performance monitoring.
 *
 * @example
 * ```typescript
 * app.use(timing);
 * // Response header: Server-Timing: total;dur=12.5
 * ```
 */
export const timing: Middleware = async (ctx, next) => {
  const response = await next();

  const duration = Date.now() - ctx.startTime;

  const headers = new Headers(response.headers);
  headers.set('server-timing', `total;dur=${duration}`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
