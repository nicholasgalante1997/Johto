import { checkDatabaseHealth } from '../../config/database';
import { jsonResponse } from '../../utils';
import type { RequestContext, HealthStatus, HealthCheckResponse } from '../../types';

const startTime = Date.now();

/**
 * GET /health
 * Service health check endpoint
 */
export async function healthCheck(
  request: Request,
  _params: Record<string, string>,
  _searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  const dbHealthy = checkDatabaseHealth();
  const dbStatus: HealthStatus = dbHealthy ? 'healthy' : 'unhealthy';

  const overallStatus: HealthStatus = dbHealthy ? 'healthy' : 'unhealthy';

  const response: HealthCheckResponse = {
    status: overallStatus,
    service: 'pokemon-rest-api',
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: dbStatus
    }
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  return jsonResponse(response, statusCode);
}
