import type { Handler } from '@pokemon/framework';
import type { Services } from '../types';
import {
  parsePaginationParams,
  createPaginationMeta,
  createPaginationLinks
} from '../utils/pagination';
import { transformCardRow, transformCardRowWithSet } from '../utils/transforms';
import type { CardRow, SetRow } from '../types';

/**
 * GET /api/v1/cards
 * List all Pokemon cards with pagination
 */
export const getCards: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  const pagination = parsePaginationParams(ctx.query.raw);

  const total =
    db.queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM pokemon_cards'
    )?.total ?? 0;

  const rows = db.findAllCards(
    pagination.limit,
    pagination.offset
  ) as CardRow[];
  const cards = rows.map(transformCardRow);

  return ctx.json({
    data: cards,
    meta: createPaginationMeta(pagination, cards.length, total),
    links: createPaginationLinks('/api/v1/cards', pagination, total)
  });
};

/**
 * GET /api/v1/cards/:id
 * Get a single card by ID with full set information
 */
export const getCardById: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  const cardRow = db.findCardById(ctx.params.id) as CardRow | null;

  if (!cardRow) {
    return ctx.notFound(`Card '${ctx.params.id}' not found`);
  }

  const setRow = db.findSetById(cardRow.set_id) as SetRow | null;
  const card = setRow
    ? transformCardRowWithSet(cardRow, setRow)
    : transformCardRow(cardRow);

  return ctx.json({ data: card });
};

/**
 * GET /api/v1/cards/search
 * Search cards by name, type, rarity, or set
 */
export const searchCards: Handler<Services> = async (ctx) => {
  const db = ctx.services.db;
  const pagination = parsePaginationParams(ctx.query.raw);

  const name = ctx.query.get('name');
  const type = ctx.query.get('type');
  const rarity = ctx.query.get('rarity');
  const setId = ctx.query.get('set');

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

  if (conditions.length === 0) {
    return ctx.badRequest(
      'At least one search parameter is required (name, type, rarity, set)'
    );
  }

  const where = conditions.join(' AND ');

  const total =
    db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM pokemon_cards WHERE ${where}`,
      ...values
    )?.total ?? 0;

  const rows = db.query<CardRow>(
    `SELECT * FROM pokemon_cards WHERE ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    ...values,
    pagination.limit,
    pagination.offset
  );

  const cards = rows.map(transformCardRow);

  // Build base URL preserving filter params for pagination links
  const searchBase = new URL('/api/v1/cards/search', 'http://localhost');
  if (name) searchBase.searchParams.set('name', name);
  if (type) searchBase.searchParams.set('type', type);
  if (rarity) searchBase.searchParams.set('rarity', rarity);
  if (setId) searchBase.searchParams.set('set', setId);

  return ctx.json({
    data: cards,
    meta: createPaginationMeta(pagination, cards.length, total),
    links: createPaginationLinks(
      searchBase.pathname + '?' + searchBase.searchParams.toString(),
      pagination,
      total
    )
  });
};
