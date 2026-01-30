import { config } from '../config';
import type { RequestContext } from '../types';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create request context
 */
export function createRequestContext(request: Request): RequestContext {
  const url = new URL(request.url);

  return {
    requestId: request.headers.get('X-Request-ID') || generateRequestId(),
    startTime: Date.now(),
    pathname: url.pathname,
    method: request.method
  };
}

/**
 * Log incoming request
 */
export function logRequest(context: RequestContext): void {
  if (config.logging.level === 'debug') {
    const log = {
      type: 'request',
      requestId: context.requestId,
      method: context.method,
      path: context.pathname,
      timestamp: new Date().toISOString()
    };

    if (config.logging.format === 'json') {
      console.log(JSON.stringify(log));
    } else {
      console.log(`[${log.timestamp}] ${log.requestId} ${log.method} ${log.path}`);
    }
  }
}

/**
 * Log response
 */
export function logResponse(context: RequestContext, response: Response): void {
  const duration = Date.now() - context.startTime;

  const log = {
    type: 'response',
    requestId: context.requestId,
    method: context.method,
    path: context.pathname,
    status: response.status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };

  if (config.logging.format === 'json') {
    console.log(JSON.stringify(log));
  } else {
    console.log(
      `[${log.timestamp}] ${log.requestId} ${log.method} ${log.path} ${log.status} ${log.duration}`
    );
  }
}
