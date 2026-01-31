/**
 * @fileoverview Core type definitions for the framework.
 * These types define the contracts for handlers, middleware, services, and routing.
 */

/**
 * HTTP methods supported by the framework
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Query parameter accessor with type coercion utilities.
 * Provides convenient methods for extracting and converting query parameters.
 */
export interface QueryParams {
  /**
   * Get a query parameter as a string
   * @param key - Parameter name
   * @returns The parameter value or undefined
   */
  get(key: string): string | undefined;

  /**
   * Get a query parameter with a default value
   * @param key - Parameter name
   * @param defaultValue - Value to return if parameter is missing
   * @returns The parameter value or the default
   */
  get(key: string, defaultValue: string): string;

  /**
   * Get a query parameter as a number
   * @param key - Parameter name
   * @returns The parsed number or undefined if missing/invalid
   */
  getNumber(key: string): number | undefined;

  /**
   * Get a query parameter as a number with a default
   * @param key - Parameter name
   * @param defaultValue - Value to return if parameter is missing/invalid
   * @returns The parsed number or the default
   */
  getNumber(key: string, defaultValue: number): number;

  /**
   * Get a query parameter as a boolean
   * Returns true if value is 'true' or '1'
   * @param key - Parameter name
   */
  getBool(key: string): boolean;

  /**
   * Get all values for a multi-value parameter
   * @param key - Parameter name
   * @returns Array of values (empty if none)
   */
  getAll(key: string): string[];

  /**
   * Check if a parameter exists
   * @param key - Parameter name
   */
  has(key: string): boolean;

  /**
   * Access the underlying URLSearchParams
   */
  readonly raw: URLSearchParams;

  toString(): string;
}

/**
 * Request context passed to all handlers and middleware.
 * Contains request data and response helper methods.
 *
 * @typeParam S - Service map type for typed service access
 */
export interface Context<S extends ServiceMap = ServiceMap> {
  /** Original Fetch API Request object */
  readonly request: Request;

  /** HTTP method (GET, POST, etc.) */
  readonly method: HttpMethod;

  /** Request path without query string */
  readonly path: string;

  /** URL path parameters extracted from route pattern */
  readonly params: Readonly<Record<string, string>>;

  /** Query parameter accessor */
  readonly query: QueryParams;

  /** Request headers */
  readonly headers: Headers;

  /** Registered services from the container */
  readonly services: S;

  /** Unique request ID for tracing/logging */
  readonly requestId: string;

  /** Request start timestamp (Date.now()) */
  readonly startTime: number;

  /**
   * Return a JSON response
   * @param data - Data to serialize as JSON
   * @param status - HTTP status code (default: 200)
   */
  json<T>(data: T, status?: number): Response;

  /**
   * Return a plain text response
   * @param data - Text content
   * @param status - HTTP status code (default: 200)
   */
  text(data: string, status?: number): Response;

  /**
   * Return an empty response
   * @param status - HTTP status code (default: 204)
   */
  empty(status?: number): Response;

  /**
   * Return a 404 Not Found response
   * @param message - Error message (default: 'Not Found')
   */
  notFound(message?: string): Response;

  /**
   * Return a 400 Bad Request response
   * @param message - Error message (default: 'Bad Request')
   */
  badRequest(message?: string): Response;

  /**
   * Return an error response
   * @param message - Error message
   * @param status - HTTP status code (default: 500)
   */
  error(message: string, status?: number): Response;
}

/**
 * Handler function signature.
 * Handlers receive a context and return a Response (sync or async).
 *
 * @typeParam S - Service map type for typed service access
 *
 * @example
 * ```typescript
 * const listCards: Handler<MyServices> = async (ctx) => {
 *   const cards = await ctx.services.cards.findAll();
 *   return ctx.json({ data: cards });
 * };
 * ```
 */
export type Handler<S extends ServiceMap = ServiceMap> = (
  ctx: Context<S>
) => Response | Promise<Response>;

/**
 * Middleware function signature.
 * Middleware wraps handlers and can modify request/response flow.
 *
 * @typeParam S - Service map type for typed service access
 *
 * @example
 * ```typescript
 * const timing: Middleware = async (ctx, next) => {
 *   const start = Date.now();
 *   const response = await next();
 *   console.log(`Request took ${Date.now() - start}ms`);
 *   return response;
 * };
 * ```
 */
export type Middleware<S extends ServiceMap = ServiceMap> = (
  ctx: Context<S>,
  next: () => Promise<Response>
) => Response | Promise<Response>;

/**
 * Service interface with optional lifecycle hooks.
 * Services can implement start() and stop() for initialization/cleanup.
 *
 * @example
 * ```typescript
 * class DatabaseService implements Service {
 *   private db: Database | null = null;
 *
 *   async start() {
 *     this.db = new Database('./data.db');
 *   }
 *
 *   async stop() {
 *     this.db?.close();
 *   }
 * }
 * ```
 */
export interface Service {
  /** Called when the container starts (before server listens) */
  start?(): Promise<void> | void;

  /** Called when the container stops (during graceful shutdown) */
  stop?(): Promise<void> | void;
}

/**
 * Service map type for type-safe service access.
 * Maps service names to their types.
 */
export type ServiceMap = Record<string, unknown>;

/**
 * Route definition before compilation
 */
export interface Route<S extends ServiceMap = ServiceMap> {
  /** HTTP method */
  method: HttpMethod;
  /** Route path (may contain :param segments) */
  path: string;
  /** Handler function */
  handler: Handler<S>;
}

/**
 * Compiled route with regex pattern for matching
 */
export interface CompiledRoute<S extends ServiceMap = ServiceMap> extends Route<S> {
  /** Compiled regex pattern */
  pattern: RegExp;
  /** Parameter names extracted from path */
  paramNames: string[];
  /** Middleware specific to this route's router */
  middleware: Middleware<S>[];
}
