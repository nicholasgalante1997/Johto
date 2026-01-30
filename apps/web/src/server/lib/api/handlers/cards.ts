import { sqlite } from '@pokemon/database';
import { getDatabase } from '../db';
import {
  parsePaginationParams,
  createPaginationMeta
} from '../utils/pagination';
import { successResponse, notFoundResponse } from '../utils/response';
import { handleApiError } from '../utils/error';
import { transformCardRow, transformCardRowWithSet } from '../utils/transforms';
import type { CardRow, SetRow } from '../types';

/**
 * GET /api/v1/cards/:id
 * Fetch a single card by ID with full set information
 */
export async function getCardById(id: string): Promise<Response> {
  try {
    const db = getDatabase();

    // Reuse findCardById from @pokemon/database
    const findCard = sqlite.findCardById(db);
    const cardRow = findCard(id) as CardRow | null;

    if (!cardRow) {
      return notFoundResponse('Card');
    }

    // Get full set data using reused function
    const findSet = sqlite.findSetById(db);
    const setRow = findSet(cardRow.set_id) as SetRow | null;

    if (!setRow) {
      // Card exists but set doesn't - return card with minimal set info
      const card = transformCardRow(cardRow);
      return successResponse(card);
    }

    // Transform with full set data
    const card = transformCardRowWithSet(cardRow, setRow);
    return successResponse(card);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/v1/cards
 * Query cards with pagination
 */
export async function getCards(
  searchParams: URLSearchParams
): Promise<Response> {
  try {
    const db = getDatabase();
    const pagination = parsePaginationParams(searchParams);

    // Get total count for pagination metadata
    const countQuery = db.query('SELECT COUNT(*) as total FROM pokemon_cards');
    const { total } = countQuery.get() as { total: number };

    // Reuse findAllCards from @pokemon/database (it already supports pagination!)
    const findAllCards = sqlite.findAllCards(db);
    const rows = findAllCards(pagination.limit, pagination.offset) as CardRow[];

    // Transform rows (without full set data for performance)
    const cards = rows.map(transformCardRow);

    const meta = createPaginationMeta(pagination, cards.length, total);

    return successResponse(cards, meta);
  } catch (error) {
    return handleApiError(error);
  }
}
