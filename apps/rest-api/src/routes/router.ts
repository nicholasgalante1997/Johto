import type { RouteDefinition, RouteHandler, RequestContext } from '../types';
import { methodNotAllowedResponse, notFoundResponse } from '../utils';

// Import handlers
import { getCards, getCardById, searchCards } from '../handlers/cards';
import { getSets, getSetById, getSetCards, getSetsBySeries } from '../handlers/sets';
import { healthCheck, readyCheck, getApiDiscovery } from '../handlers/health';

/**
 * Convert route pattern to regex and extract param names
 */
function createRoutePattern(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexPattern = path.replace(/:([^/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });

  return {
    pattern: new RegExp(`^${regexPattern}/?$`),
    paramNames
  };
}

/**
 * Define a route
 */
function route(method: string, path: string, handler: RouteHandler): RouteDefinition {
  const { pattern, paramNames } = createRoutePattern(path);
  return { method, pattern, paramNames, handler };
}

/**
 * Route definitions
 */
const routes: RouteDefinition[] = [
  // Health endpoints
  route('GET', '/health', healthCheck),
  route('GET', '/ready', readyCheck),

  // Discovery endpoint
  route('GET', '/api/v1/endpoints', getApiDiscovery),
  route('GET', '/api/v1', getApiDiscovery),

  // Card endpoints (search must come before :id to match first)
  route('GET', '/api/v1/cards/search', searchCards),
  route('GET', '/api/v1/cards/:id', getCardById),
  route('GET', '/api/v1/cards', getCards),

  // Set endpoints (series must come before :id to match first)
  route('GET', '/api/v1/sets/series/:series', getSetsBySeries),
  route('GET', '/api/v1/sets/:id/cards', getSetCards),
  route('GET', '/api/v1/sets/:id', getSetById),
  route('GET', '/api/v1/sets', getSets)
];

/**
 * Extract params from a matched route
 */
function extractParams(
  matches: RegExpMatchArray,
  paramNames: string[]
): Record<string, string> {
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = matches[index + 1];
  });
  return params;
}

/**
 * Find matching route for a request
 */
function findRoute(
  method: string,
  pathname: string
): { route: RouteDefinition; params: Record<string, string> } | null {
  for (const route of routes) {
    const matches = pathname.match(route.pattern);
    if (matches) {
      if (route.method === method) {
        const params = extractParams(matches, route.paramNames);
        return { route, params };
      }
    }
  }
  return null;
}

/**
 * Check if any route matches the path (for method not allowed)
 */
function findAllowedMethods(pathname: string): string[] {
  const methods: string[] = [];
  for (const route of routes) {
    if (pathname.match(route.pattern)) {
      methods.push(route.method);
    }
  }
  return [...new Set(methods)];
}

/**
 * Route a request to the appropriate handler
 */
export async function routeRequest(
  request: Request,
  context: RequestContext
): Promise<Response> {
  const { method, pathname } = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Find matching route
  const match = findRoute(method, pathname);

  if (match) {
    return match.route.handler(request, match.params, searchParams, context);
  }

  // Check if path exists but method is wrong
  const allowedMethods = findAllowedMethods(pathname);
  if (allowedMethods.length > 0) {
    return methodNotAllowedResponse(method, allowedMethods, context);
  }

  // No matching route
  return notFoundResponse('Endpoint', context);
}
