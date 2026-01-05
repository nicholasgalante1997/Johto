export const WEB_INDEX_ROUTES = ['/', '/index.html'];
export const WEB_ROUTES = [...WEB_INDEX_ROUTES];

export const API_ROUTES = [
  '/api/v1/cards',
  '/api/v1/cards/:id',
  '/api/v1/sets',
  '/api/v1/sets/:id',
  '/api/v1/sets/:id/cards'
];

/**
 * Check if a pathname is an API route
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/v1/');
}
