import { describe, it, expect } from 'bun:test';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
} from './pagination';

// ---------------------------------------------------------------------------
// parsePaginationParams
// ---------------------------------------------------------------------------

describe('parsePaginationParams', () => {
  // --- page-based (page param present) ---

  it('returns defaults when no params are provided', () => {
    const result = parsePaginationParams(new URLSearchParams());
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
    expect(result.offset).toBe(0);
    expect(result.page).toBe(1);
  });

  it('parses page=1 with default pageSize', () => {
    const result = parsePaginationParams(new URLSearchParams('page=1'));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
    expect(result.offset).toBe(0);
  });

  it('parses page=3 with explicit pageSize=20', () => {
    const result = parsePaginationParams(
      new URLSearchParams('page=3&pageSize=20')
    );
    expect(result.page).toBe(3);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(40); // (3-1)*20
  });

  it('clamps page below 1 to 1', () => {
    const result = parsePaginationParams(new URLSearchParams('page=0'));
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('clamps negative page to 1', () => {
    const result = parsePaginationParams(new URLSearchParams('page=-5'));
    expect(result.page).toBe(1);
  });

  it('treats non-numeric page as 1', () => {
    const result = parsePaginationParams(new URLSearchParams('page=abc'));
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('clamps pageSize above MAX_PAGE_SIZE', () => {
    const result = parsePaginationParams(
      new URLSearchParams('page=1&pageSize=999')
    );
    expect(result.limit).toBe(MAX_PAGE_SIZE);
  });

  it('pageSize=0 is treated as falsy and falls back to DEFAULT_PAGE_SIZE', () => {
    const result = parsePaginationParams(
      new URLSearchParams('page=1&pageSize=0')
    );
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('clamps negative pageSize to 1', () => {
    const result = parsePaginationParams(
      new URLSearchParams('page=1&pageSize=-5')
    );
    expect(result.limit).toBe(1);
  });

  it('treats non-numeric pageSize as DEFAULT_PAGE_SIZE', () => {
    const result = parsePaginationParams(
      new URLSearchParams('page=2&pageSize=foo')
    );
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
    expect(result.offset).toBe(DEFAULT_PAGE_SIZE); // (2-1)*60
  });

  // --- offset-based (no page param) ---

  it('parses limit and offset when page is absent', () => {
    const result = parsePaginationParams(
      new URLSearchParams('limit=10&offset=30')
    );
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(30);
    expect(result.page).toBe(4); // floor(30/10)+1
  });

  it('defaults limit to DEFAULT_PAGE_SIZE when only offset given', () => {
    const result = parsePaginationParams(new URLSearchParams('offset=120'));
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
    expect(result.offset).toBe(120);
    expect(result.page).toBe(3); // floor(120/60)+1
  });

  it('defaults offset to 0 when only limit given', () => {
    const result = parsePaginationParams(new URLSearchParams('limit=25'));
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
    expect(result.page).toBe(1);
  });

  it('clamps offset below 0 to 0', () => {
    const result = parsePaginationParams(
      new URLSearchParams('limit=10&offset=-5')
    );
    expect(result.offset).toBe(0);
  });

  it('clamps limit above MAX_PAGE_SIZE in offset mode', () => {
    const result = parsePaginationParams(
      new URLSearchParams('limit=500&offset=0')
    );
    expect(result.limit).toBe(MAX_PAGE_SIZE);
  });

  it('page param takes precedence over limit/offset', () => {
    // When page is present, limit/offset are ignored
    const result = parsePaginationParams(
      new URLSearchParams('page=2&pageSize=10&limit=99&offset=999')
    );
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// createPaginationMeta
// ---------------------------------------------------------------------------

describe('createPaginationMeta', () => {
  it('computes correct meta for a middle page', () => {
    const params = { page: 2, limit: 10, offset: 10 };
    const meta = createPaginationMeta(params, 10, 35);
    expect(meta).toEqual({
      page: 2,
      pageSize: 10,
      count: 10,
      totalCount: 35,
      totalPages: 4 // ceil(35/10)
    });
  });

  it('totalPages is 0 when totalCount is 0', () => {
    const meta = createPaginationMeta({ page: 1, limit: 60, offset: 0 }, 0, 0);
    expect(meta.totalPages).toBe(0);
    expect(meta.count).toBe(0);
  });

  it('totalPages rounds up for partial last page', () => {
    const meta = createPaginationMeta(
      { page: 1, limit: 10, offset: 0 },
      10,
      11
    );
    expect(meta.totalPages).toBe(2);
  });

  it('totalPages equals 1 when totalCount equals pageSize', () => {
    const meta = createPaginationMeta(
      { page: 1, limit: 50, offset: 0 },
      50,
      50
    );
    expect(meta.totalPages).toBe(1);
  });

  it('count can differ from pageSize (last page)', () => {
    const meta = createPaginationMeta(
      { page: 3, limit: 10, offset: 20 },
      5,
      25
    );
    expect(meta.count).toBe(5);
    expect(meta.totalPages).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// createPaginationLinks
// ---------------------------------------------------------------------------

describe('createPaginationLinks', () => {
  const base = '/api/v1/cards';

  it('single page: self + first + last, no prev/next', () => {
    const links = createPaginationLinks(
      base,
      { page: 1, limit: 60, offset: 0 },
      10
    );
    expect(links.self).toBe(`${base}?page=1&pageSize=60`);
    expect(links.first).toBe(`${base}?page=1&pageSize=60`);
    expect(links.last).toBe(`${base}?page=1&pageSize=60`);
    expect(links.prev).toBeUndefined();
    expect(links.next).toBeUndefined();
  });

  it('first page of many: has next, no prev', () => {
    const links = createPaginationLinks(
      base,
      { page: 1, limit: 10, offset: 0 },
      50
    );
    expect(links.next).toBe(`${base}?page=2&pageSize=10`);
    expect(links.prev).toBeUndefined();
    expect(links.first).toBe(`${base}?page=1&pageSize=10`);
    expect(links.last).toBe(`${base}?page=5&pageSize=10`);
  });

  it('middle page: has both prev and next', () => {
    const links = createPaginationLinks(
      base,
      { page: 3, limit: 10, offset: 20 },
      50
    );
    expect(links.prev).toBe(`${base}?page=2&pageSize=10`);
    expect(links.next).toBe(`${base}?page=4&pageSize=10`);
    expect(links.first).toBe(`${base}?page=1&pageSize=10`);
    expect(links.last).toBe(`${base}?page=5&pageSize=10`);
  });

  it('last page: has prev, no next', () => {
    const links = createPaginationLinks(
      base,
      { page: 5, limit: 10, offset: 40 },
      50
    );
    expect(links.prev).toBe(`${base}?page=4&pageSize=10`);
    expect(links.next).toBeUndefined();
    expect(links.last).toBe(`${base}?page=5&pageSize=10`);
  });

  it('empty result set: only self, no other links', () => {
    const links = createPaginationLinks(
      base,
      { page: 1, limit: 60, offset: 0 },
      0
    );
    expect(links.self).toBe(`${base}?page=1&pageSize=60`);
    expect(links.first).toBeUndefined();
    expect(links.last).toBeUndefined();
    expect(links.prev).toBeUndefined();
    expect(links.next).toBeUndefined();
  });

  it('preserves base URL with existing structure', () => {
    const customBase = '/api/v1/sets/base1/cards';
    const links = createPaginationLinks(
      customBase,
      { page: 2, limit: 10, offset: 10 },
      30
    );
    expect(links.self).toBe(`${customBase}?page=2&pageSize=10`);
    expect(links.next).toBe(`${customBase}?page=3&pageSize=10`);
  });
});
