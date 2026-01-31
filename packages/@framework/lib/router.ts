/**
 * @fileoverview Route builder and path matching utilities.
 * Provides a fluent API for defining HTTP routes with path parameters.
 */

import type {
  HttpMethod,
  Handler,
  Middleware,
  Route,
  ServiceMap
} from './types';

/**
 * Route builder for composing HTTP routes with a fluent API.
 *
 * @typeParam S - Service map type for typed handler context
 *
 * @example
 * ```typescript
 * const cards = createRouter<MyServices>('/api/v1/cards')
 *   .use(authMiddleware)
 *   .get('/', listCards)
 *   .get('/:id', getCard)
 *   .post('/', createCard);
 * ```
 */
export interface Router<S extends ServiceMap = ServiceMap> {
  /**
   * Add middleware to this router.
   * Middleware runs in registration order for all routes in this router.
   *
   * @param middleware - Middleware function to add
   * @returns Router for chaining
   */
  use(middleware: Middleware<S>): Router<S>;

  /**
   * Register a GET route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  get(path: string, handler: Handler<S>): Router<S>;

  /**
   * Register a POST route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  post(path: string, handler: Handler<S>): Router<S>;

  /**
   * Register a PUT route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  put(path: string, handler: Handler<S>): Router<S>;

  /**
   * Register a PATCH route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  patch(path: string, handler: Handler<S>): Router<S>;

  /**
   * Register a DELETE route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  delete(path: string, handler: Handler<S>): Router<S>;

  /**
   * Register a HEAD route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  head(path: string, handler: Handler<S>): Router<S>;

  /**
   * Register an OPTIONS route
   * @param path - Route path (can include :param segments)
   * @param handler - Request handler function
   */
  options(path: string, handler: Handler<S>): Router<S>;

  /** All registered routes */
  readonly routes: ReadonlyArray<Route<S>>;

  /** All registered middleware */
  readonly middleware: ReadonlyArray<Middleware<S>>;

  /** Base path for this router */
  readonly basePath: string;
}

/**
 * Create a new router instance.
 *
 * @typeParam S - Service map type for typed handler context
 * @param basePath - Base path prepended to all routes (default: '')
 * @returns New router instance
 *
 * @example
 * ```typescript
 * // Router with base path
 * const api = createRouter('/api/v1');
 *
 * // Router without base path (for health checks, etc.)
 * const health = createRouter();
 * ```
 */
export function createRouter<S extends ServiceMap = ServiceMap>(
  basePath: string = ''
): Router<S> {
  const routes: Route<S>[] = [];
  const middlewares: Middleware<S>[] = [];

  /**
   * Add a route to the router
   */
  const addRoute = (
    method: HttpMethod,
    path: string,
    handler: Handler<S>
  ): Router<S> => {
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

    get routes() {
      return routes;
    },

    get middleware() {
      return middlewares;
    },

    get basePath() {
      return basePath;
    }
  };

  return router;
}

/**
 * Normalize a URL path.
 * Ensures leading slash, removes trailing slashes, collapses multiple slashes.
 *
 * @param path - Path to normalize
 * @returns Normalized path
 *
 * @example
 * ```typescript
 * normalizePath('') // '/'
 * normalizePath('/') // '/'
 * normalizePath('api/v1') // '/api/v1'
 * normalizePath('/api/v1/') // '/api/v1'
 * normalizePath('//api//v1//') // '/api/v1'
 * ```
 */
export function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  // Collapse multiple slashes, ensure leading slash, remove trailing slash
  const normalized = '/' + path.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');

  return normalized || '/';
}

/**
 * Compiled path pattern for route matching
 */
export interface CompiledPath {
  /** Regex pattern for matching request paths */
  pattern: RegExp;
  /** Parameter names in order of appearance */
  paramNames: string[];
}

/**
 * Compile a route path pattern to a regex.
 * Converts :param segments to capture groups.
 *
 * @param path - Route path with optional :param segments
 * @returns Compiled pattern and parameter names
 *
 * @example
 * ```typescript
 * compilePath('/users/:id')
 * // { pattern: /^\/users\/([^/]+)\/?$/, paramNames: ['id'] }
 *
 * compilePath('/users/:userId/posts/:postId')
 * // { pattern: /^\/users\/([^/]+)\/posts\/([^/]+)\/?$/, paramNames: ['userId', 'postId'] }
 * ```
 */
export function compilePath(path: string): CompiledPath {
  const paramNames: string[] = [];

  // Escape special regex chars except for our :param syntax
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace :param with capture group
  const pattern = escaped.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  return {
    pattern: new RegExp(`^${pattern}/?$`),
    paramNames
  };
}

/**
 * Match a request path against a compiled route pattern.
 *
 * @param path - Request path to match
 * @param compiled - Compiled route pattern
 * @returns Extracted parameters or null if no match
 *
 * @example
 * ```typescript
 * const compiled = compilePath('/users/:id');
 * matchRoute('/users/123', compiled);
 * // { id: '123' }
 *
 * matchRoute('/posts/123', compiled);
 * // null
 * ```
 */
export function matchRoute(
  path: string,
  compiled: CompiledPath
): Record<string, string> | null {
  const match = path.match(compiled.pattern);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < compiled.paramNames.length; i++) {
    const name = compiled.paramNames[i];
    const value = match[i + 1];

    if (name && value !== undefined) {
      // Decode URI component for proper handling of encoded chars
      params[name] = decodeURIComponent(value);
    }
  }

  return params;
}
