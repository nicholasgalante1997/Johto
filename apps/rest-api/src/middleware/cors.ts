import { config } from '../config';

/**
 * CORS headers for API responses
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = config.cors.origins;

  // Check if origin is allowed
  const isAllowed = origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(request: Request): Response {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Clone response and add headers
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
