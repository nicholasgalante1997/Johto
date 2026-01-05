import { routeApiRequest } from './router';
import { errorResponse } from './utils/response';

/**
 * Handle API requests
 * Entry point for all /api/v1/* requests
 */
export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return errorResponse(
      `Method ${request.method} not allowed`,
      405,
      'METHOD_NOT_ALLOWED'
    );
  }

  // Route the request
  const response = await routeApiRequest(url.pathname, url.searchParams);

  if (response === null) {
    return errorResponse('API endpoint not found', 404, 'NOT_FOUND');
  }

  return response;
}
