import { errorResponse } from './response';

/**
 * Handle API errors and return appropriate Response
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Database readonly errors
    if (error.message.includes('readonly') || error.message.includes('read-only')) {
      return errorResponse('Database is in read-only mode', 403, 'READONLY_ERROR');
    }

    // Database file not found
    if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
      return errorResponse('Database not found', 500, 'DATABASE_ERROR');
    }

    // Generic error with message
    return errorResponse('An internal error occurred', 500, 'INTERNAL_ERROR');
  }

  // Unknown error
  return errorResponse('An unknown error occurred', 500, 'UNKNOWN_ERROR');
}
