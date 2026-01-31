# Types Reference

All TypeScript types exported by the framework.

## HTTP Types

### HttpMethod

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
```

## Handler & Middleware

### Handler

Request handler function signature:

```typescript
type Handler<S extends ServiceMap = ServiceMap> = (
  ctx: Context<S>
) => Response | Promise<Response>;
```

### Middleware

Middleware function signature:

```typescript
type Middleware<S extends ServiceMap = ServiceMap> = (
  ctx: Context<S>,
  next: () => Promise<Response>
) => Response | Promise<Response>;
```

## Context

### Context

The request context available in handlers:

```typescript
interface Context<S extends ServiceMap = ServiceMap> {
  /** Original Fetch API Request */
  request: Request;

  /** HTTP method */
  method: HttpMethod;

  /** URL pathname */
  path: string;

  /** Path parameters from route matching */
  params: Readonly<Record<string, string>>;

  /** Query parameter accessor */
  query: QueryParams;

  /** Request headers */
  headers: Headers;

  /** Registered services from container */
  services: S;

  /** Unique request identifier */
  requestId: string;

  /** Request start timestamp */
  startTime: number;

  /** Create JSON response */
  json<T>(data: T, status?: number): Response;

  /** Create text response */
  text(data: string, status?: number): Response;

  /** Create empty response */
  empty(status?: number): Response;

  /** Create 404 response */
  notFound(message?: string): Response;

  /** Create 400 response */
  badRequest(message?: string): Response;

  /** Create error response */
  error(message: string, status?: number): Response;
}
```

### QueryParams

Query parameter accessor with type coercion:

```typescript
interface QueryParams {
  /** Get string value */
  get(key: string): string | undefined;
  get(key: string, defaultValue: string): string;

  /** Get numeric value */
  getNumber(key: string): number | undefined;
  getNumber(key: string, defaultValue: number): number;

  /** Get boolean value */
  getBool(key: string): boolean;

  /** Get all values for a key */
  getAll(key: string): string[];

  /** Check if key exists */
  has(key: string): boolean;

  /** Raw URLSearchParams */
  raw: URLSearchParams;
}
```

## Service

### Service

Optional lifecycle interface for services:

```typescript
interface Service {
  /** Called when container starts */
  start?(): Promise<void> | void;

  /** Called when container stops */
  stop?(): Promise<void> | void;
}
```

### ServiceMap

Generic service map type:

```typescript
type ServiceMap = Record<string, unknown>;
```

## Route

### Route

Route definition before compilation:

```typescript
interface Route<S extends ServiceMap = ServiceMap> {
  method: HttpMethod;
  path: string;
  handler: Handler<S>;
}
```

### CompiledRoute

Route after path compilation:

```typescript
interface CompiledRoute<S extends ServiceMap = ServiceMap> {
  method: HttpMethod;
  path: string;
  handler: Handler<S>;
  pattern: RegExp;
  paramNames: string[];
}
```

### CompiledPath

Result of path compilation:

```typescript
interface CompiledPath {
  pattern: RegExp;
  paramNames: string[];
}
```

## Application

### AppOptions

Application configuration:

```typescript
interface AppOptions<S extends ServiceMap = ServiceMap> {
  container?: Container<S>;
}
```

### App

Application instance:

```typescript
interface App<S extends ServiceMap = ServiceMap> {
  use(middleware: Middleware<S>): App<S>;
  routes(router: Router<S>): App<S>;
  route(method: HttpMethod, path: string, handler: Handler<S>): App<S>;
  handle(request: Request): Promise<Response>;
  listen(port: number, callback?: () => void): Promise<void>;
  shutdown(): Promise<void>;
}
```

## Router

### Router

Router instance:

```typescript
interface Router<S extends ServiceMap = ServiceMap> {
  basePath: string;
  routes: Route<S>[];
  middleware: Middleware<S>[];

  use(middleware: Middleware<S>): Router<S>;
  get(path: string, handler: Handler<S>): Router<S>;
  post(path: string, handler: Handler<S>): Router<S>;
  put(path: string, handler: Handler<S>): Router<S>;
  patch(path: string, handler: Handler<S>): Router<S>;
  delete(path: string, handler: Handler<S>): Router<S>;
}
```

## Container

### Container

Service container:

```typescript
interface Container<S extends ServiceMap = ServiceMap> {
  register<K extends string, T>(
    name: K,
    factory: ServiceFactory<S, T>,
    options?: ServiceOptions
  ): Container<S & Record<K, T>>;

  get<K extends keyof S>(name: K): S[K];
  has(name: string): boolean;
  services: S;
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

### ServiceFactory

Factory function for creating services:

```typescript
type ServiceFactory<S extends ServiceMap, T> = (container: Container<S>) => T;
```

### ServiceOptions

Options for service registration:

```typescript
interface ServiceOptions {
  /** Create new instance on each get() call */
  transient?: boolean;
}
```

## Middleware Options

### CorsOptions

```typescript
interface CorsOptions {
  origins?: string | string[];
  methods?: string[];
  headers?: string[];
  exposeHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
```

### LoggingOptions

```typescript
interface LoggingOptions {
  logger?: (message: string) => void;
  skip?: string[];
}
```

### RateLimitOptions

```typescript
interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (ctx: Context) => string;
  handler?: (ctx: Context, retryAfter: number) => Response;
}
```
