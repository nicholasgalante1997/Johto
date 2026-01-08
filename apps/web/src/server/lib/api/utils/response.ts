import type { ApiResponse, ApiError, PaginationMeta } from '../types';

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
export function successResponse<T>(data: T, meta?: PaginationMeta): Response {
  const response: ApiResponse<T> = meta ? { data, meta } : { data };

  return jsonResponse(response, 200);
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code: string = 'INTERNAL_ERROR'
): Response {
  const error: ApiError = {
    error: {
      message,
      code,
      status
    }
  };

  return jsonResponse(error, status);
}

/**
 * Create a 404 Not Found response
 */
export function notFoundResponse(resource: string = 'Resource'): Response {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Create a 400 Bad Request response
 */
export function badRequestResponse(message: string): Response {
  return errorResponse(message, 400, 'BAD_REQUEST');
}
