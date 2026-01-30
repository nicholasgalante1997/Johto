import { getDatabase } from '../../config/database';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks,
  successResponse,
  transformSetRow,
  handleApiError
} from '../../utils';
import type { RequestContext, SetRow } from '../../types';

/**
 * GET /api/v1/sets
 * List all Pokemon TCG sets with pagination
 */
export async function getSets(
  request: Request,
  _params: Record<string, string>,
  searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const pagination = parsePaginationParams(searchParams);

    // Get total count
    const countQuery = db.query('SELECT COUNT(*) as total FROM pokemon_card_sets');
    const { total } = countQuery.get() as { total: number };

    // Get paginated sets ordered by release date (newest first)
    const query = db.query(`
      SELECT * FROM pokemon_card_sets
      ORDER BY release_date DESC
      LIMIT ? OFFSET ?
    `);

    const rows = query.all(pagination.limit, pagination.offset) as SetRow[];
    const sets = rows.map(transformSetRow);

    const meta = createPaginationMeta(pagination, sets.length, total);
    const links = createPaginationLinks('/api/v1/sets', pagination, total);

    return successResponse(sets, meta, links);
  } catch (error) {
    return handleApiError(error, context);
  }
}
