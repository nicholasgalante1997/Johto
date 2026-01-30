import { sqlite } from '@pokemon/database';
import { getDatabase } from '../../config/database';
import {
  successResponse,
  notFoundResponse,
  transformSetRow,
  handleApiError
} from '../../utils';
import type { RequestContext, SetRow } from '../../types';

/**
 * GET /api/v1/sets/:id
 * Get a single set by ID
 */
export async function getSetById(
  request: Request,
  params: Record<string, string>,
  _searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  try {
    const db = getDatabase();
    const { id } = params;

    // Find the set
    const findSet = sqlite.findSetById(db);
    const row = findSet(id) as SetRow | null;

    if (!row) {
      return notFoundResponse('Set', context);
    }

    const set = transformSetRow(row);
    return successResponse(set);
  } catch (error) {
    return handleApiError(error, context);
  }
}
