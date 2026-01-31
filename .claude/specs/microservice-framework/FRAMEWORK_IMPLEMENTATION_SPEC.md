# @pokemon/framework - Implementation Specification

A minimal, performant, type-safe microservice framework for Bun.

## Design Principles

1. **Functions over classes** - Handlers are functions, not methods
2. **Explicit over magic** - No reflection, no decorators, no auto-wiring
3. **Interfaces over inheritance** - Protocols define contracts
4. **Composition over configuration** - Build up behavior through composition
5. **Zero runtime overhead** - All wiring happens at startup

---

## Package Structure

```
packages/@framework/
├── src/
│   ├── index.ts              # Public exports
│   ├── app.ts                # Application factory and server
│   ├── router.ts             # Route builder and matcher
│   ├── context.ts            # Request context
│   ├── container.ts          # Service container
│   ├── response.ts           # Response utilities
│   ├── middleware.ts         # Middleware types and built-ins
│   └── types.ts              # Core type definitions
├── package.json
├── tsconfig.json
└── README.md
```

**Target: <500 lines total**

---

## Core Types

```typescript
// src/types.ts

/**
 * HTTP methods supported by the framework
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Query parameter accessor with type coercion
 */
export interface QueryParams {
  /** Get raw string value */
  get(key: string): string | undefined;
  /** Get string value with default */
  get(key: string, defaultValue: string): string;
  /** Get as number */
  getNumber(key: string): number | undefined;
  /** Get as number with default */
  getNumber(key: string, defaultValue: number): number;
  /** Get as boolean */
  getBool(key: string): boolean;
  /** Get all values for a key */
  getAll(key: string): string[];
  /** Check if key exists */
  has(key: string): boolean;
  /** Get underlying URLSearchParams */
  readonly raw: URLSearchParams;
}

/**
 * Request context passed to all handlers
 */
export interface Context<S extends ServiceMap = ServiceMap> {
  /** Original request */
  readonly request: Request;
  /** HTTP method */
  readonly method: HttpMethod;
  /** Request path (without query string) */
  readonly path: string;
  /** URL path parameters */
  readonly params: Readonly<Record<string, string>>;
  /** Query parameters */
  readonly query: QueryParams;
  /** Request headers */
  readonly headers: Headers;
  /** Registered services */
  readonly services: S;
  /** Request ID for tracing */
  readonly requestId: string;
  /** Request start time */
  readonly startTime: number;

  /** Return JSON response */
  json<T>(data: T, status?: number): Response;
  /** Return text response */
  text(data: string, status?: number): Response;
  /** Return empty response */
  empty(status?: number): Response;
  /** Return 404 Not Found */
  notFound(message?: string): Response;
  /** Return 400 Bad Request */
  badRequest(message?: string): Response;
  /** Return error response */
  error(message: string, status?: number): Response;
}

/**
 * Handler function signature
 */
export type Handler<S extends ServiceMap = ServiceMap> = (
  ctx: Context<S>
) => Response | Promise<Response>;

/**
 * Middleware function signature
 */
export type Middleware<S extends ServiceMap = ServiceMap> = (
  ctx: Context<S>,
  next: () => Promise<Response>
) => Response | Promise<Response>;

/**
 * Service with optional lifecycle hooks
 */
export interface Service {
  /** Called when container starts */
  start?(): Promise<void> | void;
  /** Called when container stops */
  stop?(): Promise<void> | void;
}

/**
 * Service map type for type-safe service access
 */
export type ServiceMap = Record<string, unknown>;

/**
 * Route definition
 */
export interface Route<S extends ServiceMap = ServiceMap> {
  method: HttpMethod;
  path: string;
  handler: Handler<S>;
}

/**
 * Compiled route with regex pattern
 */
export interface CompiledRoute<S extends ServiceMap = ServiceMap> extends Route<S> {
  pattern: RegExp;
  paramNames: string[];
}
```

---

## Service Container

```typescript
// src/container.ts

import type { Service, ServiceMap } from './types';

/**
 * Factory function for creating a service
 * Receives the container for resolving dependencies
 */
type ServiceFactory<T, S extends ServiceMap> = (container: Container<S>) => T;

/**
 * Service registration options
 */
interface ServiceOptions {
  /** If true, create new instance per request (default: false = singleton) */
  transient?: boolean;
}

/**
 * Lightweight dependency injection container with lifecycle management.
 *
 * @example
 * ```typescript
 * const container = createContainer()
 *   .register('db', () => new DatabaseService())
 *   .register('cards', (c) => new CardsService(c.get('db')));
 *
 * await container.start();
 * const cards = container.get('cards');
 * ```
 */
export interface Container<S extends ServiceMap = ServiceMap> {
  /**
   * Register a service factory
   *
   * @param name - Service identifier
   * @param factory - Factory function that creates the service
   * @param options - Registration options
   * @returns Container for chaining
   */
  register<K extends string, T>(
    name: K,
    factory: ServiceFactory<T, S>,
    options?: ServiceOptions
  ): Container<S & Record<K, T>>;

  /**
   * Get a registered service
   *
   * @param name - Service identifier
   * @returns The service instance
   * @throws Error if service not registered
   */
  get<K extends keyof S>(name: K): S[K];

  /**
   * Check if a service is registered
   *
   * @param name - Service identifier
   */
  has(name: string): boolean;

  /**
   * Start all services that implement the Service interface.
   * Calls start() in registration order.
   */
  start(): Promise<void>;

  /**
   * Stop all services that implement the Service interface.
   * Calls stop() in reverse registration order.
   */
  stop(): Promise<void>;

  /**
   * Get the service map for Context injection
   */
  readonly services: S;
}

/**
 * Create a new service container
 *
 * @example
 * ```typescript
 * const container = createContainer()
 *   .register('config', () => ({ port: 3001, dbPath: './data.db' }))
 *   .register('db', (c) => new Database(c.get('config').dbPath));
 * ```
 */
export function createContainer(): Container<{}> {
  const factories = new Map<string, { factory: ServiceFactory<unknown, any>; options: ServiceOptions }>();
  const instances = new Map<string, unknown>();
  const startOrder: string[] = [];

  const container: Container<any> = {
    register(name, factory, options = {}) {
      factories.set(name, { factory, options });
      startOrder.push(name);
      return container;
    },

    get(name) {
      // Return cached singleton
      if (instances.has(name as string)) {
        return instances.get(name as string);
      }

      const registration = factories.get(name as string);
      if (!registration) {
        throw new Error(`Service '${String(name)}' not registered`);
      }

      const instance = registration.factory(container);

      // Cache if singleton
      if (!registration.options.transient) {
        instances.set(name as string, instance);
      }

      return instance;
    },

    has(name) {
      return factories.has(name);
    },

    async start() {
      for (const name of startOrder) {
        const instance = container.get(name);
        if (instance && typeof instance === 'object' && 'start' in instance) {
          await (instance as Service).start?.();
        }
      }
    },

    async stop() {
      for (const name of [...startOrder].reverse()) {
        const instance = instances.get(name);
        if (instance && typeof instance === 'object' && 'stop' in instance) {
          await (instance as Service).stop?.();
        }
      }
    },

    get services() {
      // Lazy-build services object
      const services: Record<string, unknown> = {};
      for (const name of factories.keys()) {
        Object.defineProperty(services, name, {
          get: () => container.get(name),
          enumerable: true
        });
      }
      return services as any;
    }
  };

  return container;
}
```

---

## Router

```typescript
// src/router.ts

import type { HttpMethod, Handler, Middleware, Route, CompiledRoute, ServiceMap } from './types';

/**
 * Route builder for composing HTTP routes.
 *
 * @example
 * ```typescript
 * const cards = createRouter('/api/v1/cards')
 *   .use(authMiddleware)
 *   .get('/', listCards)
 *   .get('/:id', getCard)
 *   .post('/', createCard);
 * ```
 */
export interface Router<S extends ServiceMap = ServiceMap> {
  /**
   * Add middleware to this router.
   * Middleware runs in order for all routes in this router.
   */
  use(middleware: Middleware<S>): Router<S>;

  /** Register a GET route */
  get(path: string, handler: Handler<S>): Router<S>;

  /** Register a POST route */
  post(path: string, handler: Handler<S>): Router<S>;

  /** Register a PUT route */
  put(path: string, handler: Handler<S>): Router<S>;

  /** Register a PATCH route */
  patch(path: string, handler: Handler<S>): Router<S>;

  /** Register a DELETE route */
  delete(path: string, handler: Handler<S>): Router<S>;

  /** Register a HEAD route */
  head(path: string, handler: Handler<S>): Router<S>;

  /** Register a OPTIONS route */
  options(path: string, handler: Handler<S>): Router<S>;

  /** Get all registered routes */
  readonly routes: Route<S>[];

  /** Get all registered middleware */
  readonly middleware: Middleware<S>[];

  /** Base path for this router */
  readonly basePath: string;
}

/**
 * Create a new router instance
 *
 * @param basePath - Base path prepended to all routes (default: '')
 *
 * @example
 * ```typescript
 * const api = createRouter('/api/v1');
 * const health = createRouter(); // No base path
 * ```
 */
export function createRouter<S extends ServiceMap = ServiceMap>(basePath: string = ''): Router<S> {
  const routes: Route<S>[] = [];
  const middlewares: Middleware<S>[] = [];

  const addRoute = (method: HttpMethod, path: string, handler: Handler<S>) => {
    const fullPath = normalizePath(basePath + path);
    routes.push({ method, path: fullPath, handler });
    return router;
  };

  const router: Router<S> = {
    use(middleware) {
      middlewares.push(middleware);
      return router;
    },

    get: (path, handler) => addRoute('GET', path, handler),
    post: (path, handler) => addRoute('POST', path, handler),
    put: (path, handler) => addRoute('PUT', path, handler),
    patch: (path, handler) => addRoute('PATCH', path, handler),
    delete: (path, handler) => addRoute('DELETE', path, handler),
    head: (path, handler) => addRoute('HEAD', path, handler),
    options: (path, handler) => addRoute('OPTIONS', path, handler),

    get routes() { return routes; },
    get middleware() { return middlewares; },
    get basePath() { return basePath; }
  };

  return router;
}

/**
 * Normalize a path (remove trailing slashes, ensure leading slash)
 */
function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return '/' + path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

/**
 * Compile a route path to a regex pattern
 *
 * @param path - Route path with optional :param segments
 * @returns Compiled pattern and parameter names
 *
 * @example
 * ```typescript
 * compilePath('/users/:id/posts/:postId')
 * // { pattern: /^\/users\/([^/]+)\/posts\/([^/]+)\/?$/, paramNames: ['id', 'postId'] }
 * ```
 */
export function compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];

  const pattern = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  return {
    pattern: new RegExp(`^${pattern}/?$`),
    paramNames
  };
}

/**
 * Match a request path against a compiled route
 *
 * @returns Extracted parameters or null if no match
 */
export function matchRoute(
  path: string,
  compiled: { pattern: RegExp; paramNames: string[] }
): Record<string, string> | null {
  const match = path.match(compiled.pattern);
  if (!match) return null;

  const params: Record<string, string> = {};
  compiled.paramNames.forEach((name, i) => {
    params[name] = match[i + 1];
  });

  return params;
}
```

---

## Request Context

```typescript
// src/context.ts

import type { Context, QueryParams, HttpMethod, ServiceMap } from './types';

/**
 * Create query parameter accessor
 */
function createQueryParams(searchParams: URLSearchParams): QueryParams {
  return {
    get(key: string, defaultValue?: string): string | undefined {
      return searchParams.get(key) ?? defaultValue;
    },

    getNumber(key: string, defaultValue?: number): number | undefined {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      const num = Number(value);
      return Number.isNaN(num) ? defaultValue : num;
    },

    getBool(key: string): boolean {
      const value = searchParams.get(key);
      return value === 'true' || value === '1';
    },

    getAll(key: string): string[] {
      return searchParams.getAll(key);
    },

    has(key: string): boolean {
      return searchParams.has(key);
    },

    get raw() {
      return searchParams;
    }
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a request context
 *
 * @param request - Incoming request
 * @param params - Extracted path parameters
 * @param services - Service map from container
 */
export function createContext<S extends ServiceMap>(
  request: Request,
  params: Record<string, string>,
  services: S
): Context<S> {
  const url = new URL(request.url);
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  return {
    request,
    method: request.method as HttpMethod,
    path: url.pathname,
    params,
    query: createQueryParams(url.searchParams),
    headers: request.headers,
    services,
    requestId,
    startTime,

    json(data, status = 200) {
      return Response.json(data, {
        status,
        headers: { 'x-request-id': requestId }
      });
    },

    text(data, status = 200) {
      return new Response(data, {
        status,
        headers: {
          'content-type': 'text/plain',
          'x-request-id': requestId
        }
      });
    },

    empty(status = 204) {
      return new Response(null, {
        status,
        headers: { 'x-request-id': requestId }
      });
    },

    notFound(message = 'Not Found') {
      return Response.json(
        { error: { code: 'NOT_FOUND', message, status: 404 } },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    },

    badRequest(message = 'Bad Request') {
      return Response.json(
        { error: { code: 'BAD_REQUEST', message, status: 400 } },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    },

    error(message, status = 500) {
      const code = status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
      return Response.json(
        { error: { code, message, status } },
        { status, headers: { 'x-request-id': requestId } }
      );
    }
  };
}
```

---

## Application

```typescript
// src/app.ts

import type { Handler, Middleware, ServiceMap, CompiledRoute, Context } from './types';
import type { Container } from './container';
import type { Router } from './router';
import { createContext } from './context';
import { compilePath, matchRoute } from './router';

/**
 * Application configuration options
 */
export interface AppOptions<S extends ServiceMap = ServiceMap> {
  /** Service container */
  container?: Container<S>;
}

/**
 * Application instance
 */
export interface App<S extends ServiceMap = ServiceMap> {
  /**
   * Add global middleware
   */
  use(middleware: Middleware<S>): App<S>;

  /**
   * Add routes from a router
   */
  routes(router: Router<S>): App<S>;

  /**
   * Add a single route
   */
  route(method: string, path: string, handler: Handler<S>): App<S>;

  /**
   * Handle a request (useful for testing)
   */
  handle(request: Request): Promise<Response>;

  /**
   * Start the server
   *
   * @param port - Port to listen on
   * @param callback - Called when server is ready
   */
  listen(port: number, callback?: () => void): Promise<void>;

  /**
   * Gracefully shutdown the server
   */
  shutdown(): Promise<void>;
}

/**
 * Create a new application instance
 *
 * @example
 * ```typescript
 * const app = createApp({ container })
 *   .use(logging)
 *   .use(cors())
 *   .routes(cardsRouter)
 *   .routes(setsRouter);
 *
 * await app.listen(3001);
 * ```
 */
export function createApp<S extends ServiceMap = ServiceMap>(
  options: AppOptions<S> = {}
): App<S> {
  const { container } = options;
  const globalMiddleware: Middleware<S>[] = [];
  const compiledRoutes: Array<CompiledRoute<S> & { middleware: Middleware<S>[] }> = [];

  const services = (container?.services ?? {}) as S;

  /**
   * Execute middleware chain then handler
   */
  async function executeHandler(
    ctx: Context<S>,
    handler: Handler<S>,
    middleware: Middleware<S>[]
  ): Promise<Response> {
    const allMiddleware = [...globalMiddleware, ...middleware];

    let index = 0;

    const next = async (): Promise<Response> => {
      if (index < allMiddleware.length) {
        const mw = allMiddleware[index++];
        return mw(ctx, next);
      }
      return handler(ctx);
    };

    return next();
  }

  /**
   * Handle incoming request
   */
  async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Find matching route
    for (const route of compiledRoutes) {
      if (route.method !== method) continue;

      const params = matchRoute(path, route);
      if (params) {
        const ctx = createContext(request, params, services);

        try {
          return await executeHandler(ctx, route.handler, route.middleware);
        } catch (err) {
          console.error(`[${ctx.requestId}] Error:`, err);
          return ctx.error(
            err instanceof Error ? err.message : 'Internal Server Error',
            500
          );
        }
      }
    }

    // No route matched
    const ctx = createContext(request, {}, services);
    return ctx.notFound(`Cannot ${method} ${path}`);
  }

  const app: App<S> = {
    use(middleware) {
      globalMiddleware.push(middleware);
      return app;
    },

    routes(router) {
      for (const route of router.routes) {
        const { pattern, paramNames } = compilePath(route.path);
        compiledRoutes.push({
          ...route,
          pattern,
          paramNames,
          middleware: router.middleware
        });
      }
      return app;
    },

    route(method, path, handler) {
      const { pattern, paramNames } = compilePath(path);
      compiledRoutes.push({
        method: method as any,
        path,
        handler,
        pattern,
        paramNames,
        middleware: []
      });
      return app;
    },

    async handle(request) {
      return handleRequest(request);
    },

    async listen(port, callback) {
      // Start container services
      if (container) {
        await container.start();
      }

      // Start server
      Bun.serve({
        port,
        fetch: handleRequest
      });

      // Register shutdown handlers
      const shutdown = async () => {
        await app.shutdown();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      callback?.();
    },

    async shutdown() {
      if (container) {
        await container.stop();
      }
    }
  };

  return app;
}
```

---

## Built-in Middleware

```typescript
// src/middleware.ts

import type { Middleware, Context } from './types';

/**
 * CORS middleware options
 */
export interface CorsOptions {
  /** Allowed origins (default: '*') */
  origins?: string | string[];
  /** Allowed methods (default: all) */
  methods?: string[];
  /** Allowed headers */
  headers?: string[];
  /** Exposed headers */
  exposeHeaders?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Max age in seconds */
  maxAge?: number;
}

/**
 * Create CORS middleware
 *
 * @example
 * ```typescript
 * app.use(cors({ origins: ['http://localhost:3000'] }));
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

  return async (ctx, next) => {
    const origin = ctx.headers.get('origin');
    const isAllowed = allowedOrigins.includes('*') ||
      (origin && allowedOrigins.includes(origin));

    // Handle preflight
    if (ctx.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': isAllowed ? (origin || '*') : '',
          'access-control-allow-methods': methods.join(', '),
          'access-control-allow-headers': headers.join(', '),
          'access-control-max-age': String(maxAge),
          ...(credentials && { 'access-control-allow-credentials': 'true' })
        }
      });
    }

    const response = await next();

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    if (isAllowed) {
      newHeaders.set('access-control-allow-origin', origin || '*');
      newHeaders.set('access-control-expose-headers', exposeHeaders.join(', '));
      if (credentials) {
        newHeaders.set('access-control-allow-credentials', 'true');
      }
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  };
}

/**
 * Request logging middleware
 *
 * @example
 * ```typescript
 * app.use(logging);
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
 * Rate limiting options
 */
export interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000) */
  windowMs?: number;
  /** Max requests per window (default: 100) */
  max?: number;
  /** Function to generate client key (default: x-forwarded-for or 'global') */
  keyGenerator?: (ctx: Context) => string;
}

/**
 * Create rate limiting middleware
 *
 * @example
 * ```typescript
 * app.use(rateLimit({ windowMs: 60000, max: 1000 }));
 * ```
 */
export function rateLimit(options: RateLimitOptions = {}): Middleware {
  const {
    windowMs = 60000,
    max = 100,
    keyGenerator = (ctx) => ctx.headers.get('x-forwarded-for') || 'global'
  } = options;

  const hits = new Map<string, { count: number; resetTime: number }>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits) {
      if (now > value.resetTime) hits.delete(key);
    }
  }, windowMs);

  return async (ctx, next) => {
    const key = keyGenerator(ctx);
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      hits.set(key, record);
    }

    record.count++;

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return new Response(
        JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json',
            'retry-after': String(retryAfter),
            'x-ratelimit-limit': String(max),
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Math.ceil(record.resetTime / 1000))
          }
        }
      );
    }

    const response = await next();

    // Add rate limit headers
    const headers = new Headers(response.headers);
    headers.set('x-ratelimit-limit', String(max));
    headers.set('x-ratelimit-remaining', String(max - record.count));
    headers.set('x-ratelimit-reset', String(Math.ceil(record.resetTime / 1000)));

    return new Response(response.body, {
      status: response.status,
      headers
    });
  };
}

/**
 * Security headers middleware
 *
 * @example
 * ```typescript
 * app.use(securityHeaders);
 * ```
 */
export const securityHeaders: Middleware = async (ctx, next) => {
  const response = await next();

  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('x-xss-protection', '1; mode=block');

  return new Response(response.body, {
    status: response.status,
    headers
  });
};
```

---

## Public API

```typescript
// src/index.ts

export { createApp } from './app';
export type { App, AppOptions } from './app';

export { createRouter, compilePath, matchRoute } from './router';
export type { Router } from './router';

export { createContainer } from './container';
export type { Container } from './container';

export { createContext } from './context';

export { cors, logging, rateLimit, securityHeaders } from './middleware';
export type { CorsOptions, RateLimitOptions } from './middleware';

export type {
  HttpMethod,
  Handler,
  Middleware,
  Context,
  QueryParams,
  Service,
  ServiceMap,
  Route
} from './types';
```

---

## Complete Example: REST API

```typescript
// apps/rest-api/src/main.ts

import {
  createApp,
  createRouter,
  createContainer,
  cors,
  logging,
  rateLimit,
  securityHeaders
} from '@pokemon/framework';

import { DatabaseService } from './services/database';
import { CardsService } from './services/cards';
import { SetsService } from './services/sets';

// ============================================================
// 1. Container Setup
// ============================================================

const container = createContainer()
  .register('db', () => new DatabaseService(process.env.DATABASE_PATH!))
  .register('cards', (c) => new CardsService(c.get('db')))
  .register('sets', (c) => new SetsService(c.get('db')));

// Type for our services
type Services = typeof container.services;

// ============================================================
// 2. Route Definitions
// ============================================================

const cards = createRouter<Services>('/api/v1/cards')
  .get('/', async (ctx) => {
    const page = ctx.query.getNumber('page', 1);
    const pageSize = ctx.query.getNumber('pageSize', 60);

    const result = await ctx.services.cards.findAll({ page, pageSize });

    return ctx.json({
      data: result.cards,
      meta: {
        page,
        pageSize,
        totalCount: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });
  })

  .get('/search', async (ctx) => {
    const name = ctx.query.get('name');
    const type = ctx.query.get('type');
    const rarity = ctx.query.get('rarity');
    const setId = ctx.query.get('set');

    if (!name && !type && !rarity && !setId) {
      return ctx.badRequest('At least one search parameter required');
    }

    const cards = await ctx.services.cards.search({ name, type, rarity, setId });
    return ctx.json({ data: cards });
  })

  .get('/:id', async (ctx) => {
    const card = await ctx.services.cards.findById(ctx.params.id);

    if (!card) {
      return ctx.notFound(`Card '${ctx.params.id}' not found`);
    }

    return ctx.json({ data: card });
  });

const sets = createRouter<Services>('/api/v1/sets')
  .get('/', async (ctx) => {
    const page = ctx.query.getNumber('page', 1);
    const pageSize = ctx.query.getNumber('pageSize', 50);

    const result = await ctx.services.sets.findAll({ page, pageSize });

    return ctx.json({
      data: result.sets,
      meta: { page, pageSize, totalCount: result.total }
    });
  })

  .get('/:id', async (ctx) => {
    const set = await ctx.services.sets.findById(ctx.params.id);
    if (!set) return ctx.notFound();
    return ctx.json({ data: set });
  })

  .get('/:id/cards', async (ctx) => {
    const page = ctx.query.getNumber('page', 1);
    const pageSize = ctx.query.getNumber('pageSize', 60);

    const result = await ctx.services.cards.findBySet(ctx.params.id, { page, pageSize });
    return ctx.json({ data: result.cards, meta: { page, pageSize, total: result.total } });
  });

const health = createRouter<Services>()
  .get('/health', async (ctx) => {
    return ctx.json({
      status: 'healthy',
      service: 'rest-api',
      timestamp: new Date().toISOString()
    });
  })

  .get('/ready', async (ctx) => {
    const dbOk = await ctx.services.db.ping();
    return ctx.json({ ready: dbOk }, dbOk ? 200 : 503);
  });

// ============================================================
// 3. Application Assembly
// ============================================================

const app = createApp({ container })
  .use(logging)
  .use(securityHeaders)
  .use(cors({ origins: process.env.CORS_ORIGINS?.split(',') || ['*'] }))
  .use(rateLimit({ windowMs: 60000, max: 1000 }))
  .routes(health)
  .routes(cards)
  .routes(sets);

// ============================================================
// 4. Start Server
// ============================================================

const PORT = parseInt(process.env.PORT || '3001', 10);

await app.listen(PORT, () => {
  console.log(`REST API listening on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
```

---

## Service Examples

```typescript
// apps/rest-api/src/services/database.ts

import { Database } from 'bun:sqlite';
import type { Service } from '@pokemon/framework';

/**
 * SQLite database service with lifecycle management
 */
export class DatabaseService implements Service {
  private db: Database | null = null;

  constructor(private readonly path: string) {}

  async start(): Promise<void> {
    this.db = new Database(this.path, { readonly: true });
    this.db.run('PRAGMA query_only = ON');
    console.log(`[db] Connected to ${this.path}`);
  }

  async stop(): Promise<void> {
    this.db?.close();
    this.db = null;
    console.log('[db] Connection closed');
  }

  async ping(): Promise<boolean> {
    try {
      this.db?.query('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  query<T>(sql: string, params: unknown[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.query(sql).all(...params) as T[];
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | null {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.query(sql).get(...params) as T | null;
  }

  count(table: string, where?: string, params: unknown[] = []): number {
    const sql = where
      ? `SELECT COUNT(*) as n FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as n FROM ${table}`;
    return this.queryOne<{ n: number }>(sql, params)?.n ?? 0;
  }
}


// apps/rest-api/src/services/cards.ts

import { DatabaseService } from './database';

interface FindAllOptions {
  page: number;
  pageSize: number;
}

interface SearchOptions {
  name?: string;
  type?: string;
  rarity?: string;
  setId?: string;
}

/**
 * Card data access service
 */
export class CardsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(options: FindAllOptions) {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    const total = this.db.count('pokemon_cards');
    const cards = this.db.query(
      'SELECT * FROM pokemon_cards ORDER BY name LIMIT ? OFFSET ?',
      [pageSize, offset]
    );

    return { cards, total };
  }

  async findById(id: string) {
    return this.db.queryOne('SELECT * FROM pokemon_cards WHERE id = ?', [id]);
  }

  async findBySet(setId: string, options: FindAllOptions) {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    const total = this.db.count('pokemon_cards', 'set_id = ?', [setId]);
    const cards = this.db.query(
      'SELECT * FROM pokemon_cards WHERE set_id = ? ORDER BY CAST(number AS INTEGER) LIMIT ? OFFSET ?',
      [setId, pageSize, offset]
    );

    return { cards, total };
  }

  async search(options: SearchOptions) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (options.name) {
      conditions.push('name LIKE ?');
      values.push(`%${options.name}%`);
    }
    if (options.type) {
      conditions.push('types LIKE ?');
      values.push(`%"${options.type}"%`);
    }
    if (options.rarity) {
      conditions.push('rarity = ?');
      values.push(options.rarity);
    }
    if (options.setId) {
      conditions.push('set_id = ?');
      values.push(options.setId);
    }

    const where = conditions.join(' AND ');
    return this.db.query(`SELECT * FROM pokemon_cards WHERE ${where} ORDER BY name`, values);
  }
}
```

---

## Testing

```typescript
// apps/rest-api/src/cards.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createApp, createRouter, createContainer } from '@pokemon/framework';

// Mock service
const mockCardsService = {
  findAll: async () => ({ cards: [{ id: '1', name: 'Pikachu' }], total: 1 }),
  findById: async (id: string) => id === '1' ? { id: '1', name: 'Pikachu' } : null,
};

const container = createContainer()
  .register('cards', () => mockCardsService);

const router = createRouter<typeof container.services>('/api/v1/cards')
  .get('/', async (ctx) => {
    const result = await ctx.services.cards.findAll();
    return ctx.json({ data: result.cards });
  })
  .get('/:id', async (ctx) => {
    const card = await ctx.services.cards.findById(ctx.params.id);
    if (!card) return ctx.notFound();
    return ctx.json({ data: card });
  });

const app = createApp({ container }).routes(router);

describe('Cards API', () => {
  it('GET /api/v1/cards returns cards', async () => {
    const res = await app.handle(new Request('http://test/api/v1/cards'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Pikachu');
  });

  it('GET /api/v1/cards/:id returns card', async () => {
    const res = await app.handle(new Request('http://test/api/v1/cards/1'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.name).toBe('Pikachu');
  });

  it('GET /api/v1/cards/:id returns 404 for unknown', async () => {
    const res = await app.handle(new Request('http://test/api/v1/cards/999'));
    expect(res.status).toBe(404);
  });
});
```

---

## Implementation Plan

| Phase | Task | Est. Lines |
|-------|------|------------|
| 1 | `types.ts` - Core type definitions | ~60 |
| 2 | `container.ts` - Service container | ~80 |
| 3 | `router.ts` - Route builder & matcher | ~70 |
| 4 | `context.ts` - Request context | ~80 |
| 5 | `app.ts` - Application & server | ~100 |
| 6 | `middleware.ts` - Built-in middleware | ~120 |
| 7 | `index.ts` - Public exports | ~20 |
| **Total** | | **~530** |

### Deliverables

1. **`packages/@framework`** - Complete framework package
2. **Migrated `apps/rest-api`** - Using new framework
3. **Tests** - Unit tests for framework + integration tests for API
4. **Documentation** - README with examples

---

## Validation Approach (Zod)

Validation is bring-your-own. Here's the recommended pattern:

```typescript
import { z } from 'zod';

// Define schema
const SearchParamsSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  rarity: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(250).default(60)
});

// Validation helper
function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Usage in handler
.get('/search', async (ctx) => {
  const params = validate(SearchParamsSchema, Object.fromEntries(ctx.query.raw));

  if (!params.name && !params.type && !params.rarity) {
    return ctx.badRequest('At least one search parameter required');
  }

  const cards = await ctx.services.cards.search(params);
  return ctx.json({ data: cards });
})
```

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Service lifecycle | Container-managed via `start()`/`stop()` |
| Validation | Bring-your-own (Zod recommended) |
| GraphQL | Deferred to separate spec |
| DI approach | Explicit factory functions, no reflection |
| Decorators | None - pure functions and composition |

---

## Next Steps

1. **Review this spec** - Any adjustments before implementation?
2. **Create `packages/@framework`** - Implement core framework
3. **Migrate `apps/rest-api`** - Proof of concept
4. **Migrate `apps/web` BFF** - Apply same patterns
