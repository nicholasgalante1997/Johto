import type { Handler } from '@pokemon/framework';
import type { Services } from '../types';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks
} from '../utils/pagination';
import { transformSetRow, transformCardRow } from '../utils/transforms';
import type { CardRow, SetRow } from '../types';

/**
 * GET /api/v1/sets
 * List all Pokemon TCG sets with pagination
 */
export const getSets: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  const pagination = parsePaginationParams(ctx.query.raw);

  const total =
    db.queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM pokemon_card_sets'
    )?.total ?? 0;

  const rows = db.query<SetRow>(
    'SELECT * FROM pokemon_card_sets ORDER BY release_date DESC LIMIT ? OFFSET ?',
    pagination.limit,
    pagination.offset
  );

  const sets = rows.map(transformSetRow);

  return ctx.json({
    data: sets,
    meta: createPaginationMeta(pagination, sets.length, total),
    links: createPaginationLinks('/api/v1/sets', pagination, total)
  });
};

/**
 * GET /api/v1/sets/:id
 * Get a single set by ID
 */
export const getSetById: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  const row = db.findSetById(ctx.params.id) as SetRow | null;

  if (!row) {
    return ctx.notFound(`Set '${ctx.params.id}' not found`);
  }

  return ctx.json({ data: transformSetRow(row) });
};

/**
 * GET /api/v1/sets/:id/cards
 * Get all cards in a specific set with pagination
 */
export const getSetCards: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  const setId = ctx.params.id;

  const setExists = db.findSetById(setId);
  if (!setExists) {
    return ctx.notFound(`Set '${setId}' not found`);
  }

  const pagination = parsePaginationParams(ctx.query.raw);

  const total =
    db.queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM pokemon_cards WHERE set_id = ?',
      setId
    )?.total ?? 0;

  const rows = db.query<CardRow>(
    'SELECT * FROM pokemon_cards WHERE set_id = ? ORDER BY CAST(number AS INTEGER) ASC, number ASC LIMIT ? OFFSET ?',
    setId,
    pagination.limit,
    pagination.offset
  );

  const cards = rows.map(transformCardRow);

  return ctx.json({
    data: cards,
    meta: createPaginationMeta(pagination, cards.length, total),
    links: createPaginationLinks(
      `/api/v1/sets/${setId}/cards`,
      pagination,
      total
    )
  });
};

/**
 * GET /api/v1/sets/series/:series
 * Get all sets in a specific series
 */
export const getSetsBySeries: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  // Framework already decodes URI components in path params
  const series = ctx.params.series;

  const rows = db.query<SetRow>(
    'SELECT * FROM pokemon_card_sets WHERE series = ? ORDER BY release_date DESC',
    series
  );

  const sets = rows.map(transformSetRow);

  return ctx.json({ data: sets });
};
