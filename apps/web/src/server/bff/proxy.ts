import { bffConfig } from './config';
import { restApiCircuit, graphqlApiCircuit, withCircuitBreaker } from './circuitBreaker';

/**
 * Proxy a request to the REST API microservice with circuit breaker
 */
export async function proxyToRestApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `${bffConfig.restApiUrl}${url.pathname}${url.search}`;

  // Check if circuit is open
  if (restApiCircuit.isOpen()) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'REST API is temporarily unavailable',
          circuitState: restApiCircuit.getState()
        }
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '30' }
      }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    // Record success for circuit breaker
    if (response.ok) {
      restApiCircuit.recordSuccess();
    } else if (response.status >= 500) {
      restApiCircuit.recordFailure();
    }

    // Clone headers and add metadata
    const headers = new Headers(response.headers);
    headers.set('X-Proxied-By', 'bff');
    headers.set('X-Circuit-State', restApiCircuit.getState());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    restApiCircuit.recordFailure();
    console.error('Proxy to REST API failed:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to proxy request to REST API',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Proxy a request to the GraphQL API microservice with circuit breaker
 */
export async function proxyToGraphqlApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `${bffConfig.graphqlApiUrl}${url.pathname}${url.search}`;

  // Check if circuit is open
  if (graphqlApiCircuit.isOpen()) {
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: 'GraphQL API is temporarily unavailable',
            extensions: {
              code: 'SERVICE_UNAVAILABLE',
              circuitState: graphqlApiCircuit.getState()
            }
          }
        ]
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '30' }
      }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    // Record success for circuit breaker
    if (response.ok) {
      graphqlApiCircuit.recordSuccess();
    } else if (response.status >= 500) {
      graphqlApiCircuit.recordFailure();
    }

    // Clone headers and add metadata
    const headers = new Headers(response.headers);
    headers.set('X-Proxied-By', 'bff');
    headers.set('X-Circuit-State', graphqlApiCircuit.getState());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    graphqlApiCircuit.recordFailure();
    console.error('Proxy to GraphQL API failed:', error);
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: 'Failed to proxy request to GraphQL API',
            extensions: {
              code: 'PROXY_ERROR',
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        ]
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
