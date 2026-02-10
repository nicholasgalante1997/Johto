import type { PaginationMeta } from '../types';

export type PaginationParams = {
  limit: number;
  offset: number;
};

export const DEFAULT_PAGE_SIZE = 60;
export const MAX_PAGE_SIZE = 250;

/**
 * Parse pagination parameters from URL search params
 * Supports both page-based (?page=1&pageSize=50) and offset-based (?limit=50&offset=0)
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  // Try page-based first
  const pageStr = searchParams.get('page');
  const pageSizeStr = searchParams.get('pageSize');

  if (pageStr !== null) {
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(pageSizeStr || '', 10) || DEFAULT_PAGE_SIZE)
    );

    return {
      limit: pageSize,
      offset: (page - 1) * pageSize
    };
  }

  // Fall back to offset-based
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(limitStr || '', 10) || DEFAULT_PAGE_SIZE)
  );
  const offset = Math.max(0, parseInt(offsetStr || '', 10) || 0);

  return { limit, offset };
}

/**
 * Create pagination metadata for API response
 */
export function createPaginationMeta(
  params: PaginationParams,
  count: number,
  totalCount: number
): PaginationMeta {
  const page = Math.floor(params.offset / params.limit) + 1;

  return {
    page,
    pageSize: params.limit,
    count,
    totalCount
  };
}
