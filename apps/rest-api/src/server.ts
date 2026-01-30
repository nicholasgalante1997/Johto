import { config } from './config';
import { routeRequest } from './routes';
import {
  createRequestContext,
  logRequest,
  logResponse,
  handleCorsPreflightRequest,
  addCorsHeaders,
  addRateLimitHeaders,
  addSecurityHeaders
} from './middleware';

/**
 * Main request handler
 */
async function handleRequest(request: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  // Create request context
  const context = createRequestContext(request);

  // Log incoming request
  logRequest(context);

  // Route the request
  let response = await routeRequest(request, context);

  // Add headers
  response = addCorsHeaders(response, request);
  response = addRateLimitHeaders(response, request);
  response = addSecurityHeaders(response);

  // Add request ID header
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Request-ID', context.requestId);
  response = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });

  // Log response
  logResponse(context, response);

  return response;
}

/**
 * Start the server
 */
export function startServer(): void {
  const server = Bun.serve({
    port: config.port,
    hostname: config.host,
    fetch: handleRequest
  });

  console.log(`Pokemon TCG REST API listening on http://${config.host}:${config.port}`);
  console.log(`Health check: http://${config.host}:${config.port}/health`);
  console.log(`API Discovery: http://${config.host}:${config.port}/api/v1/endpoints`);
}
