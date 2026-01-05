import { getCardById, getCards } from './handlers/cards';
import { getSetById, getSets, getCardsBySetId } from './handlers/sets';

type RoutePattern = {
  pattern: RegExp;
  handler: (
    matches: RegExpMatchArray,
    searchParams: URLSearchParams
  ) => Promise<Response>;
};

const routes: RoutePattern[] = [
  // GET /api/v1/cards/:id
  {
    pattern: /^\/api\/v1\/cards\/([^\/]+)$/,
    handler: async (matches) => {
      const id = matches[1];
      return getCardById(id);
    }
  },

  // GET /api/v1/cards
  {
    pattern: /^\/api\/v1\/cards\/?$/,
    handler: async (_, searchParams) => {
      return getCards(searchParams);
    }
  },

  // GET /api/v1/sets/:id/cards
  {
    pattern: /^\/api\/v1\/sets\/([^\/]+)\/cards\/?$/,
    handler: async (matches, searchParams) => {
      const setId = matches[1];
      return getCardsBySetId(setId, searchParams);
    }
  },

  // GET /api/v1/sets/:id
  {
    pattern: /^\/api\/v1\/sets\/([^\/]+)$/,
    handler: async (matches) => {
      const id = matches[1];
      return getSetById(id);
    }
  },

  // GET /api/v1/sets
  {
    pattern: /^\/api\/v1\/sets\/?$/,
    handler: async (_, searchParams) => {
      return getSets(searchParams);
    }
  }
];

/**
 * Route an API request to the appropriate handler
 * @returns Response if route matched, null if no match
 */
export async function routeApiRequest(
  pathname: string,
  searchParams: URLSearchParams
): Promise<Response | null> {
  // Try to match each route pattern
  for (const route of routes) {
    const matches = pathname.match(route.pattern);
    if (matches) {
      return route.handler(matches, searchParams);
    }
  }

  // No route matched
  return null;
}
