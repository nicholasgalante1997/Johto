import { sqlite } from '@pokemon/database';
import { getDatabase } from '../../config/database';
import {
  successResponse,
  notFoundResponse,
  transformCardRow,
  transformCardRowWithSet,
  handleApiError
} from '../../utils';
import type { RequestContext, CardRow, SetRow } from '../../types';

/**
 * GET /api/v1/cards/:id
 * Get a single card by ID with full set information
 */
export async function getCardById(
  request: Request,
  params: Record<string, string>,
  _searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const { id } = params;

    // Find the card
    const findCard = sqlite.findCardById(db);
    const cardRow = findCard(id) as CardRow | null;

    if (!cardRow) {
      return notFoundResponse('Card', context);
    }

    // Get full set data
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
    return handleApiError(error, context);
  }
}
