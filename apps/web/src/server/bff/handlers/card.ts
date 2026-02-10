import { graphqlClient } from '../clients';
import { bffCache } from '../cache';
import type { BffContext, CardDetailData, BffResponse } from '../types';

const CACHE_PREFIX = 'bff:card:';
const CACHE_TTL = 120000; // 2 minutes

/**
 * GET /bff/card/:id
 * Fetches detailed card data with related cards
 */
export async function getCardDetail(
  request: Request,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  context: BffContext
): Promise<Response> {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'BAD_REQUEST',
          message: 'Card ID is required'
        }
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': context.requestId
        }
      }
    );
  }

  // Check cache first
  const cacheKey = `${CACHE_PREFIX}${id}`;
  const cached = bffCache.get<CardDetailData>(cacheKey);
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
  const data: Partial<CardDetailData> = {};

  // Fetch card
  try {
    const cardResult = await graphqlClient.getCard(id);

    if (!cardResult.card) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: `Card ${id} not found`
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': context.requestId
          }
        }
      );
    }

    data.card = cardResult.card;
    data.set = cardResult.card.set
      ? {
          id: cardResult.card.set.id,
          name: cardResult.card.set.name,
          series: cardResult.card.set.series,
          total: cardResult.card.set.total,
          releaseDate: cardResult.card.set.releaseDate,
          images: cardResult.card.set.images
        }
      : undefined;

    // Fetch related cards (same Pokemon name)
    const baseName = cardResult.card.name.split(' ')[0]; // Get base Pokemon name
    try {
      const relatedResult = await graphqlClient.getCardsByName(baseName);
      data.relatedCards = relatedResult.cardsByName
        .filter((c: any) => c.id !== id) // Exclude current card
        .slice(0, 6) // Limit to 6 related cards
        .map((card: any) => ({
          id: card.id,
          name: card.name,
          supertype: card.supertype,
          types: card.types,
          rarity: card.rarity,
          images: card.images,
          set: card.set ? { id: card.set.id, name: card.set.name } : undefined
        }));
    } catch (error) {
      // Non-critical error, continue without related cards
      data.relatedCards = [];
      errors.push({
        source: 'graphql',
        code: 'RELATED_CARDS_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch related cards'
      });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'FETCH_FAILED',
          message:
            error instanceof Error ? error.message : 'Failed to fetch card'
        }
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': context.requestId
        }
      }
    );
  }

  // Cache if no critical errors
  if (data.card) {
    bffCache.set(cacheKey, data as CardDetailData, CACHE_TTL);
  }

  const response: BffResponse<CardDetailData> = { data };
  if (errors.length > 0) {
    response.warnings = errors.map((e) => e.message);
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'X-Request-ID': context.requestId
    }
  });
}
