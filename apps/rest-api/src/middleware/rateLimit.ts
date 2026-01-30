import { config } from '../config';
import { rateLimitResponse } from '../utils';
import type { RequestContext } from '../types';

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar distributed store
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Get client identifier from request
 */
function getClientId(request: Request): string {
  // Try to get client IP from headers (for proxied requests)
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('X-Real-IP');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (not ideal but works for local dev)
  return 'default-client';
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or a Response if rate limited
 */
export function checkRateLimit(
  request: Request,
  context: RequestContext
): Response | null {
  const clientId = getClientId(request);
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  let clientData = requestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    // New window
    clientData = {
      count: 1,
      resetTime: now + windowMs
    };
    requestCounts.set(clientId, clientData);
    return null;
  }

  clientData.count++;

  if (clientData.count > maxRequests) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    return rateLimitResponse(retryAfter, context);
  }

  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  request: Request
): Response {
  const clientId = getClientId(request);
  const clientData = requestCounts.get(clientId);

  if (!clientData) {
    return response;
  }

  const remaining = Math.max(0, config.rateLimit.maxRequests - clientData.count);
  const reset = Math.ceil(clientData.resetTime / 1000);

  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
  newHeaders.set('X-RateLimit-Remaining', remaining.toString());
  newHeaders.set('X-RateLimit-Reset', reset.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
