import { sqlite } from '@pokemon/database';
import { getDatabase } from '../db';
import { parsePaginationParams, createPaginationMeta } from '../utils/pagination';
import { successResponse, notFoundResponse } from '../utils/response';
import { handleApiError } from '../utils/error';
import { transformSetRow, transformCardRow } from '../utils/transforms';
import type { SetRow, CardRow } from '../types';

/**
 * GET /api/v1/sets/:id
 * Fetch a single set by ID
 */
export async function getSetById(id: string): Promise<Response> {
  try {
    const db = getDatabase();

    // Reuse findSetById from @pokemon/database
    const findSet = sqlite.findSetById(db);
    const row = findSet(id) as SetRow | null;

    if (!row) {
      return notFoundResponse('Set');
    }

    const set = transformSetRow(row);
    return successResponse(set);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/v1/sets
 * List all sets with pagination
 */
export async function getSets(searchParams: URLSearchParams): Promise<Response> {
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

    return successResponse(sets, meta);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/v1/sets/:id/cards
 * Get all cards in a specific set with pagination
 */
export async function getCardsBySetId(
  setId: string,
  searchParams: URLSearchParams
): Promise<Response> {
  try {
    const db = getDatabase();

    // First verify the set exists using reused function
    const findSet = sqlite.findSetById(db);
    const setExists = findSet(setId);

    if (!setExists) {
      return notFoundResponse('Set');
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

    return successResponse(cards, meta);
  } catch (error) {
    return handleApiError(error);
  }
}
