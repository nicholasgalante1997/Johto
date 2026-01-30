import { restApiClient, graphqlClient } from '../clients';
import type { BffContext } from '../types';

/**
 * GET /bff/health
 * Check health of BFF and downstream services
 */
export async function getBffHealth(
  request: Request,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  context: BffContext
): Promise<Response> {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check REST API
  const restStart = Date.now();
  try {
    await restApiClient.healthCheck();
    checks.restApi = { status: 'healthy', latency: Date.now() - restStart };
  } catch (error) {
    checks.restApi = {
      status: 'unhealthy',
      latency: Date.now() - restStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Check GraphQL API
  const graphqlStart = Date.now();
  try {
    await graphqlClient.healthCheck();
    checks.graphqlApi = { status: 'healthy', latency: Date.now() - graphqlStart };
  } catch (error) {
    checks.graphqlApi = {
      status: 'unhealthy',
      latency: Date.now() - graphqlStart,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Overall status
  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
  const someHealthy = Object.values(checks).some((c) => c.status === 'healthy');

  const overallStatus = allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy';

  return new Response(
    JSON.stringify({
      status: overallStatus,
      service: 'pokemon-bff',
      timestamp: new Date().toISOString(),
      checks
    }),
    {
      status: allHealthy ? 200 : someHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': context.requestId
      }
    }
  );
}
