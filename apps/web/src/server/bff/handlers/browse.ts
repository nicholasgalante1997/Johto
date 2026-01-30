import { restApiClient } from '../clients';
import { bffCache } from '../cache';
import type { BffContext, BrowseData, BffResponse } from '../types';

const FILTERS_CACHE_KEY = 'bff:browse:filters';
const FILTERS_CACHE_TTL = 300000; // 5 minutes

/**
 * GET /bff/browse
 * Aggregates data for the browse page
 */
export async function getBrowse(
  request: Request,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  context: BffContext
): Promise<Response> {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '60', 10);
  const name = searchParams.get('name') || undefined;
  const type = searchParams.get('type') || undefined;
  const rarity = searchParams.get('rarity') || undefined;
  const setId = searchParams.get('set') || undefined;

  const errors: Array<{ source: string; code: string; message: string }> = [];
  const data: Partial<BrowseData> = {};

  // Fetch cards
  try {
    let cardsResponse;

    if (name || type || rarity || setId) {
      cardsResponse = await restApiClient.searchCards({
        name,
        type,
        rarity,
        set: setId,
        page,
        pageSize
      });
    } else {
      cardsResponse = await restApiClient.getCards(page, pageSize);
    }

    data.cards = cardsResponse.data.map((card: any) => ({
      id: card.id,
      name: card.name,
      supertype: card.supertype,
      types: card.types,
      rarity: card.rarity,
      images: card.images,
      set: card.set ? { id: card.set.id, name: card.set.name } : undefined
    }));

    data.pagination = {
      page: cardsResponse.meta.page,
      pageSize: cardsResponse.meta.pageSize,
      totalCount: cardsResponse.meta.totalCount,
      totalPages: cardsResponse.meta.totalPages
    };
  } catch (error) {
    errors.push({
      source: 'rest',
      code: 'CARDS_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch cards'
    });
    data.cards = [];
    data.pagination = { page: 1, pageSize, totalCount: 0, totalPages: 0 };
  }

  // Get filters from cache or fetch
  let filters = bffCache.get<BrowseData['filters']>(FILTERS_CACHE_KEY);

  if (!filters) {
    try {
      const setsResponse = await restApiClient.getSets(1, 100);

      // Extract unique types and rarities from sets (we'd need cards for accurate filters)
      // For now, use common Pokemon types
      filters = {
        types: [
          'Colorless',
          'Darkness',
          'Dragon',
          'Fairy',
          'Fighting',
          'Fire',
          'Grass',
          'Lightning',
          'Metal',
          'Psychic',
          'Water'
        ],
        rarities: [
          'Common',
          'Uncommon',
          'Rare',
          'Rare Holo',
          'Rare Holo EX',
          'Rare Holo GX',
          'Rare Holo V',
          'Rare Holo VMAX',
          'Rare Ultra',
          'Rare Secret'
        ],
        sets: setsResponse.data.map((set: any) => ({
          id: set.id,
          name: set.name,
          series: set.series,
          total: set.total,
          releaseDate: set.releaseDate,
          images: set.images
        }))
      };

      bffCache.set(FILTERS_CACHE_KEY, filters, FILTERS_CACHE_TTL);
    } catch (error) {
      errors.push({
        source: 'rest',
        code: 'FILTERS_FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch filters'
      });
      filters = { types: [], rarities: [], sets: [] };
    }
  }

  data.filters = filters;

  const response: BffResponse<BrowseData> = { data };
  if (errors.length > 0) {
    response.errors = errors;
  }

  return new Response(JSON.stringify(response), {
    status: errors.length > 0 && !data.cards?.length ? 503 : 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': context.requestId
    }
  });
}
