import { restApiClient, graphqlClient } from '../clients';
import { bffCache } from '../cache';
import type { BffContext, DashboardData, BffResponse } from '../types';

const CACHE_KEY = 'bff:dashboard';
const CACHE_TTL = 60000; // 1 minute

/**
 * GET /bff/dashboard
 * Aggregates data for the dashboard page
 */
export async function getDashboard(
  request: Request,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  context: BffContext
): Promise<Response> {
  // Check cache first
  const cached = bffCache.get<DashboardData>(CACHE_KEY);
  if (cached) {
    return new Response(JSON.stringify({ data: cached }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'X-Request-ID': context.requestId
      }
    });
  }

  const errors: Array<{ source: string; code: string; message: string }> = [];
  const data: Partial<DashboardData> = {};

  // Fetch in parallel
  const [setsResult, statsResult, cardsResult] = await Promise.allSettled([
    graphqlClient.getRecentSets(5),
    graphqlClient.getStats(),
    restApiClient.getCards(1, 8)
  ]);

  // Process sets
  if (setsResult.status === 'fulfilled') {
    data.recentSets = setsResult.value.sets.edges.map((edge) => ({
      id: edge.node.id,
      name: edge.node.name,
      series: edge.node.series,
      total: edge.node.total,
      releaseDate: edge.node.releaseDate,
      images: edge.node.images
    }));
  } else {
    errors.push({
      source: 'graphql',
      code: 'SETS_FETCH_FAILED',
      message: setsResult.reason?.message || 'Failed to fetch sets'
    });
    data.recentSets = [];
  }

  // Process stats
  if (statsResult.status === 'fulfilled') {
    data.stats = statsResult.value.stats;
  } else {
    errors.push({
      source: 'graphql',
      code: 'STATS_FETCH_FAILED',
      message: statsResult.reason?.message || 'Failed to fetch stats'
    });
    data.stats = { totalCards: 0, totalSets: 0, lastUpdated: null };
  }

  // Process featured cards
  if (cardsResult.status === 'fulfilled') {
    data.featuredCards = cardsResult.value.data.map((card: any) => ({
      id: card.id,
      name: card.name,
      supertype: card.supertype,
      types: card.types,
      rarity: card.rarity,
      images: card.images,
      set: card.set ? { id: card.set.id, name: card.set.name } : undefined
    }));
  } else {
    errors.push({
      source: 'rest',
      code: 'CARDS_FETCH_FAILED',
      message: cardsResult.reason?.message || 'Failed to fetch cards'
    });
    data.featuredCards = [];
  }

  // Cache if no errors
  if (errors.length === 0) {
    bffCache.set(CACHE_KEY, data as DashboardData, CACHE_TTL);
  }

  const response: BffResponse<DashboardData> = { data };
  if (errors.length > 0) {
    response.errors = errors;
  }

  return new Response(JSON.stringify(response), {
    status: errors.length === Object.keys(data).length ? 503 : 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'X-Request-ID': context.requestId
    }
  });
}
