import { sqlite } from '@pokemon/database';
import { getDatabase } from '../../config/database';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks,
  successResponse,
  notFoundResponse,
  transformCardRow,
  handleApiError
} from '../../utils';
import type { RequestContext, CardRow } from '../../types';

/**
 * GET /api/v1/sets/:id/cards
 * Get all cards in a specific set with pagination
 */
export async function getSetCards(
  request: Request,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const { id: setId } = params;

    // First verify the set exists
    const findSet = sqlite.findSetById(db);
    const setExists = findSet(setId);

    if (!setExists) {
      return notFoundResponse('Set', context);
    }

    const pagination = parsePaginationParams(searchParams);

    // Get total count for this set
    const countQuery = db.query(
      'SELECT COUNT(*) as total FROM pokemon_cards WHERE set_id = ?'
    );
    const { total } = countQuery.get(setId) as { total: number };

    // Get paginated cards for this set
    const query = db.query(`
      SELECT * FROM pokemon_cards
      WHERE set_id = ?
      ORDER BY CAST(number AS INTEGER) ASC, number ASC
      LIMIT ? OFFSET ?
    `);

    const rows = query.all(setId, pagination.limit, pagination.offset) as CardRow[];
    const cards = rows.map(transformCardRow);

    const meta = createPaginationMeta(pagination, cards.length, total);
    const links = createPaginationLinks(`/api/v1/sets/${setId}/cards`, pagination, total);

    return successResponse(cards, meta, links);
  } catch (error) {
    return handleApiError(error, context);
  }
}
