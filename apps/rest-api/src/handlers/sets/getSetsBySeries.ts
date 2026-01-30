import { getDatabase } from '../../config/database';
import {
  successResponse,
  transformSetRow,
  handleApiError
} from '../../utils';
import type { RequestContext, SetRow } from '../../types';

/**
 * GET /api/v1/sets/series/:series
 * Get all sets in a specific series
 */
export async function getSetsBySeries(
  request: Request,
  params: Record<string, string>,
  _searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const { series } = params;

    // Decode URI component for series names with spaces
    const decodedSeries = decodeURIComponent(series);

    // Get all sets in this series
    const query = db.query(`
      SELECT * FROM pokemon_card_sets
      WHERE series = ?
      ORDER BY release_date DESC
    `);

    const rows = query.all(decodedSeries) as SetRow[];
    const sets = rows.map(transformSetRow);

    return successResponse(sets);
  } catch (error) {
    return handleApiError(error, context);
  }
}
