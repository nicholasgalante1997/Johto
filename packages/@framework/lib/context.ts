/**
 * @fileoverview Request context creation and utilities.
 * The context wraps a request with convenient accessors and response helpers.
 */

import type { Context, QueryParams, HttpMethod, ServiceMap } from './types';

/**
 * Create a query parameter accessor from URLSearchParams.
 *
 * @param searchParams - URL search parameters
 * @returns QueryParams accessor with type coercion methods
 */
function createQueryParams(searchParams: URLSearchParams): QueryParams {
  const queryParams: QueryParams = {
    get(key: string, defaultValue?: string): any {
      const value = searchParams.get(key);
      return value ?? defaultValue;
    },

    getNumber(key: string, defaultValue?: number): any {
      const value = searchParams.get(key);

      if (value === null) {
        return defaultValue;
      }

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
    },

    toString() {
      return this.raw.toString();
    },
  };

  return queryParams;
}

/**
 * Generate a unique request ID.
 * Format: timestamp-randomstring (e.g., "m5abc123-x7yz456")
 *
 * @returns Unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Standard error response body structure
 */
interface ErrorBody {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * Create a JSON error response.
 *
 * @param code - Error code (e.g., 'NOT_FOUND', 'BAD_REQUEST')
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param requestId - Request ID for tracing
 * @returns JSON Response with error body
 */
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  requestId: string
): Response {
  const body: ErrorBody = {
    error: { code, message, status }
  };

  return Response.json(body, {
    status,
    headers: { 'x-request-id': requestId }
  });
}

/**
 * Create a request context.
 *
 * The context wraps a Fetch API Request with:
 * - Parsed URL components (path, query params)
 * - Path parameters from route matching
 * - Service access
 * - Response helper methods
 *
 * @typeParam S - Service map type for typed service access
 * @param request - Incoming Fetch API Request
 * @param params - Path parameters extracted from route matching
 * @param services - Service map from the container
 * @returns Request context
 *
 * @example
 * ```typescript
 * const ctx = createContext(request, { id: '123' }, services);
 *
 * // Access request data
 * ctx.method // 'GET'
 * ctx.path // '/api/v1/cards/123'
 * ctx.params.id // '123'
 * ctx.query.getNumber('page', 1) // 1
 *
 * // Create responses
 * ctx.json({ data: cards })
 * ctx.notFound('Card not found')
 * ```
 */
export function createContext<S extends ServiceMap>(
  request: Request,
  params: Record<string, string>,
  services: S
): Context<S> {
  const url = new URL(request.url);
  const startTime = Date.now();

  // Use existing request ID or generate new one
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  const ctx: Context<S> = {
    request,
    method: request.method as HttpMethod,
    path: url.pathname,
    params: Object.freeze(params),
    query: createQueryParams(url.searchParams),
    headers: request.headers,
    services,
    requestId,
    startTime,

    json<T>(data: T, status = 200): Response {
      return Response.json(data, {
        status,
        headers: { 'x-request-id': requestId }
      });
    },

    text(data: string, status = 200): Response {
      return new Response(data, {
        status,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-request-id': requestId
        }
      });
    },

    empty(status = 204): Response {
      return new Response(null, {
        status,
        headers: { 'x-request-id': requestId }
      });
    },

    notFound(message = 'Not Found'): Response {
      return createErrorResponse('NOT_FOUND', message, 404, requestId);
    },

    badRequest(message = 'Bad Request'): Response {
      return createErrorResponse('BAD_REQUEST', message, 400, requestId);
    },

    error(message: string, status = 500): Response {
      const code = status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
      return createErrorResponse(code, message, status, requestId);
    }
  };

  return ctx;
}
