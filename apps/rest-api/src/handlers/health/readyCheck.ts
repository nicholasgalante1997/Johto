import { checkDatabaseHealth } from '../../config/database';
import { jsonResponse } from '../../utils';
import type { RequestContext } from '../../types';

/**
 * GET /ready
 * Readiness probe endpoint
 * Returns 200 if the service is ready to accept traffic
 */
export async function readyCheck(
  request: Request,
  _params: Record<string, string>,
  _searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  const dbHealthy = checkDatabaseHealth();

  if (dbHealthy) {
    return jsonResponse({ ready: true }, 200);
  }

  return jsonResponse({ ready: false, reason: 'database unavailable' }, 503);
}
