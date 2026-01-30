import { sqlite } from '@pokemon/database';
import { getDatabase } from '../../config/database';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks,
  successResponse,
  transformCardRow,
  handleApiError
} from '../../utils';
import type { RequestContext, CardRow } from '../../types';

/**
 * GET /api/v1/cards
 * List all Pokemon cards with pagination
 */
export async function getCards(
  request: Request,
  _params: Record<string, string>,
  searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const pagination = parsePaginationParams(searchParams);

    // Get total count for pagination metadata
    const countQuery = db.query('SELECT COUNT(*) as total FROM pokemon_cards');
    const { total } = countQuery.get() as { total: number };

    // Reuse findAllCards from @pokemon/database
    const findAllCards = sqlite.findAllCards(db);
    const rows = findAllCards(pagination.limit, pagination.offset) as CardRow[];

    // Transform rows
    const cards = rows.map(transformCardRow);

    const meta = createPaginationMeta(pagination, cards.length, total);
    const links = createPaginationLinks('/api/v1/cards', pagination, total);

    return successResponse(cards, meta, links);
  } catch (error) {
    return handleApiError(error, context);
  }
}
