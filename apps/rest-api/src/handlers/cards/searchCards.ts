import { getDatabase } from '../../config/database';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks,
  successResponse,
  badRequestResponse,
  transformCardRow,
  handleApiError
} from '../../utils';
import type { RequestContext, CardRow } from '../../types';

/**
 * GET /api/v1/cards/search
 * Search cards by name, type, rarity, or set
 */
export async function searchCards(
  request: Request,
  _params: Record<string, string>,
  searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const pagination = parsePaginationParams(searchParams);

    // Extract search parameters
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const rarity = searchParams.get('rarity');
    const setId = searchParams.get('set');

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (name) {
      conditions.push('name LIKE ?');
      values.push(`%${name}%`);
    }

    if (type) {
      conditions.push('types LIKE ?');
      values.push(`%"${type}"%`);
    }

    if (rarity) {
      conditions.push('rarity = ?');
      values.push(rarity);
    }

    if (setId) {
      conditions.push('set_id = ?');
      values.push(setId);
    }

    // Require at least one search parameter
    if (conditions.length === 0) {
      return badRequestResponse(
        'At least one search parameter is required (name, type, rarity, set)',
        context
      );
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = db.query(
      `SELECT COUNT(*) as total FROM pokemon_cards WHERE ${whereClause}`
    );
    const { total } = countQuery.get(...values) as { total: number };

    // Get paginated results
    const query = db.query(`
      SELECT * FROM pokemon_cards
      WHERE ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `);

    const rows = query.all(...values, pagination.limit, pagination.offset) as CardRow[];
    const cards = rows.map(transformCardRow);

    const meta = createPaginationMeta(pagination, cards.length, total);

    // Build search URL with all params
    const searchUrl = new URL('/api/v1/cards/search', 'http://localhost');
    if (name) searchUrl.searchParams.set('name', name);
    if (type) searchUrl.searchParams.set('type', type);
    if (rarity) searchUrl.searchParams.set('rarity', rarity);
    if (setId) searchUrl.searchParams.set('set', setId);

    const links = createPaginationLinks(
      searchUrl.pathname + '?' + searchUrl.searchParams.toString(),
      pagination,
      total
    );

    return successResponse(cards, meta, links);
  } catch (error) {
    return handleApiError(error, context);
  }
}
