import type { ApiResponse, ApiError, PaginationMeta, PaginationLinks, RequestContext } from '../types';

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * Create a success response with optional pagination metadata
 */
export function successResponse<T>(
  data: T,
  meta?: PaginationMeta,
  links?: PaginationLinks
): Response {
  const response: ApiResponse<T> = { data };

  if (meta) {
    response.meta = meta;
  }

  if (links) {
    response.links = links;
  }

  return jsonResponse(response, 200);
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code: string = 'INTERNAL_ERROR',
  context?: RequestContext,
  details?: Record<string, unknown>
): Response {
  const error: ApiError = {
    error: {
      code,
      message,
      status,
      service: 'rest-api',
      requestId: context?.requestId,
      details
    }
  };

  return jsonResponse(error, status);
}

/**
 * Create a 404 Not Found response
 */
export function notFoundResponse(
  resource: string = 'Resource',
  context?: RequestContext
): Response {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND', context);
}

/**
 * Create a 400 Bad Request response
 */
export function badRequestResponse(
  message: string,
  context?: RequestContext,
  details?: Record<string, unknown>
): Response {
  return errorResponse(message, 400, 'BAD_REQUEST', context, details);
}

/**
 * Create a 405 Method Not Allowed response
 */
export function methodNotAllowedResponse(
  method: string,
  allowed: string[],
  context?: RequestContext
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${method} not allowed`,
        status: 405,
        service: 'rest-api',
        requestId: context?.requestId,
        details: { allowed }
      }
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: allowed.join(', ')
      }
    }
  );
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitResponse(
  retryAfter: number,
  context?: RequestContext
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        status: 429,
        service: 'rest-api',
        requestId: context?.requestId
      }
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}

/**
 * Create a 503 Service Unavailable response
 */
export function serviceUnavailableResponse(
  message: string = 'Service temporarily unavailable',
  context?: RequestContext
): Response {
  return errorResponse(message, 503, 'SERVICE_UNAVAILABLE', context);
}
