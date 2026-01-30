import { Database } from 'bun:sqlite';
import { sqlite } from '@pokemon/database';
import { GraphQLError } from 'graphql';
import type { DataLoaders } from '../dataloaders';
import { formatUser, formatSet, formatCard, encodeCursor } from '../utils';
import { checkDatabaseHealth } from '../config/database';

const {
  findUserById,
  findAllUsers,
  findSetById,
  findAllSets,
  findSetsBySeries,
  findCardById,
  findCardsBySetId,
  findCardsByName,
  findAllCards
} = sqlite;

const startTime = Date.now();

export interface ResolverContext {
  db: Database;
  loaders: DataLoaders;
  request: Request;
}

export function createResolvers(db: Database) {
  return {
    Query: {
      // ===== USER QUERIES =====
      user: (_: any, args: { id: string }, context: ResolverContext) => {
        const user = findUserById(db)(parseInt(args.id));
        if (!user) {
          throw new GraphQLError(`User with id ${args.id} not found`, {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return formatUser(user);
      },

      users: (_: any, args: { limit: number }) => {
        const users = findAllUsers(db)();
        return users.slice(0, args.limit).map(formatUser);
      },

      // ===== SET QUERIES =====
      set: (_: any, args: { id: string }) => {
        const set = findSetById(db)(args.id);
        if (!set) {
          throw new GraphQLError(`Set with id ${args.id} not found`, {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return formatSet(set);
      },

      sets: (_: any, args: { limit: number; offset: number }) => {
        // Get total count
        const countQuery = db.query('SELECT COUNT(*) as total FROM pokemon_card_sets');
        const { total } = countQuery.get() as { total: number };

        // Get paginated sets
        const query = db.query(`
          SELECT * FROM pokemon_card_sets
          ORDER BY release_date DESC
          LIMIT ? OFFSET ?
        `);
        const sets = query.all(args.limit, args.offset) as any[];
        const formattedSets = sets.map(formatSet);

        // Build connection response
        return {
          edges: formattedSets.map((set, index) => ({
            node: set,
            cursor: encodeCursor(args.offset + index)
          })),
          pageInfo: {
            hasNextPage: args.offset + args.limit < total,
            hasPreviousPage: args.offset > 0,
            startCursor: formattedSets.length > 0 ? encodeCursor(args.offset) : null,
            endCursor: formattedSets.length > 0 ? encodeCursor(args.offset + formattedSets.length - 1) : null
          },
          totalCount: total
        };
      },

      setsBySeries: (_: any, args: { series: string }) => {
        const sets = findSetsBySeries(db)(args.series);
        return sets.map(formatSet);
      },

      // ===== CARD QUERIES =====
      card: (_: any, args: { id: string }) => {
        const card = findCardById(db)(args.id);
        if (!card) {
          throw new GraphQLError(`Card with id ${args.id} not found`, {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return formatCard(card);
      },

      cards: (
        _: any,
        args: {
          limit: number;
          offset: number;
          name?: string;
          types?: string[];
          rarity?: string;
          setId?: string;
        }
      ) => {
        // Build dynamic query
        const conditions: string[] = [];
        const values: (string | number)[] = [];

        if (args.name) {
          conditions.push('name LIKE ?');
          values.push(`%${args.name}%`);
        }

        if (args.types && args.types.length > 0) {
          const typeConditions = args.types.map(() => 'types LIKE ?');
          conditions.push(`(${typeConditions.join(' OR ')})`);
          args.types.forEach((type) => values.push(`%"${type}"%`));
        }

        if (args.rarity) {
          conditions.push('rarity = ?');
          values.push(args.rarity);
        }

        if (args.setId) {
          conditions.push('set_id = ?');
          values.push(args.setId);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = db.query(`SELECT COUNT(*) as total FROM pokemon_cards ${whereClause}`);
        const { total } = countQuery.get(...values) as { total: number };

        // Get paginated cards
        const query = db.query(`
          SELECT * FROM pokemon_cards
          ${whereClause}
          ORDER BY name ASC
          LIMIT ? OFFSET ?
        `);
        const cards = query.all(...values, args.limit, args.offset) as any[];
        const formattedCards = cards.map(formatCard);

        return {
          edges: formattedCards.map((card, index) => ({
            node: card,
            cursor: encodeCursor(args.offset + index)
          })),
          pageInfo: {
            hasNextPage: args.offset + args.limit < total,
            hasPreviousPage: args.offset > 0,
            startCursor: formattedCards.length > 0 ? encodeCursor(args.offset) : null,
            endCursor: formattedCards.length > 0 ? encodeCursor(args.offset + formattedCards.length - 1) : null
          },
          totalCount: total
        };
      },

      cardsBySet: (_: any, args: { setId: string; limit: number; offset: number }) => {
        const cards = findCardsBySetId(db)(args.setId);
        return cards.slice(args.offset, args.offset + args.limit).map(formatCard);
      },

      cardsByName: (_: any, args: { name: string }) => {
        const cards = findCardsByName(db)(args.name);
        return cards.map(formatCard);
      },

      // ===== STATISTICS =====
      stats: () => {
        const cardCount = db.query('SELECT COUNT(*) as count FROM pokemon_cards').get() as { count: number };
        const setCount = db.query('SELECT COUNT(*) as count FROM pokemon_card_sets').get() as { count: number };
        const lastUpdated = db.query('SELECT MAX(updated_at) as last FROM pokemon_cards').get() as { last: string };

        return {
          totalCards: cardCount.count,
          totalSets: setCount.count,
          lastUpdated: lastUpdated.last
        };
      },

      // ===== HEALTH CHECK =====
      health: () => {
        const dbHealthy = checkDatabaseHealth();
        return {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          database: dbHealthy ? 'connected' : 'disconnected',
          uptime: Math.floor((Date.now() - startTime) / 1000),
          timestamp: new Date().toISOString()
        };
      }
    },

    // ===== FIELD RESOLVERS =====
    Card: {
      set: (parent: any, _args: any, context: ResolverContext) => {
        // Use DataLoader for batched loading
        return context.loaders.setLoader.load(parent.setId).then((set) => {
          if (!set) return null;
          return formatSet(set);
        });
      }
    },

    Set: {
      cards: (parent: any, args: { limit: number; offset: number }, context: ResolverContext) => {
        return context.loaders.cardsBySetLoader.load(parent.id).then((cards) => {
          return cards.slice(args.offset, args.offset + args.limit).map(formatCard);
        });
      },

      cardCount: (parent: any, _args: any, context: ResolverContext) => {
        return context.loaders.cardCountBySetLoader.load(parent.id);
      }
    }
  };
}
