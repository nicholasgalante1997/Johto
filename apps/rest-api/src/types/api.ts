/**
 * Pagination metadata for API responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
  totalPages: number;
}

/**
 * HATEOAS links for API responses
 */
export interface PaginationLinks {
  self: string;
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

/**
 * Standard API response envelope
 */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
    service?: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Request context passed through middleware
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
  pathname: string;
  method: string;
}

/**
 * Handler function signature
 */
export type RouteHandler = (
  request: Request,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  context: RequestContext
) => Promise<Response>;

/**
 * Route definition
 */
export interface RouteDefinition {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthStatus;
  };
}
