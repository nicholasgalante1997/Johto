import { errorResponse } from './response';
import type { RequestContext } from '../types';

/**
 * Custom API error class
 */
export class ApiException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Not Found error
 */
export class NotFoundException extends ApiException {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundException';
  }
}

/**
 * Bad Request error
 */
export class BadRequestException extends ApiException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestException';
  }
}

/**
 * Database error
 */
export class DatabaseException extends ApiException {
  constructor(message: string = 'Database error') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseException';
  }
}

/**
 * Handle API errors and return appropriate Response
 */
export function handleApiError(error: unknown, context?: RequestContext): Response {
  // Log the error
  console.error(`[${context?.requestId || 'unknown'}] API Error:`, error);

  // Handle known API exceptions
  if (error instanceof ApiException) {
    return errorResponse(error.message, error.statusCode, error.code, context, error.details);
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Database readonly errors
    if (error.message.includes('readonly') || error.message.includes('read-only')) {
      return errorResponse('Database is in read-only mode', 403, 'READONLY_ERROR', context);
    }

    // Database file not found
    if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
      return errorResponse('Database not found', 500, 'DATABASE_ERROR', context);
    }

    // SQLite errors
    if (error.message.includes('SQLITE')) {
      return errorResponse('Database error', 500, 'DATABASE_ERROR', context);
    }
  }

  // Unknown error
  return errorResponse('An internal error occurred', 500, 'INTERNAL_ERROR', context);
}
