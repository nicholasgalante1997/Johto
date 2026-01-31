import { GraphQLError } from 'graphql';
import type { DataLoaders } from '../dataloaders';
import type { DatabaseService } from '../services/database';
import { formatUser, formatSet, formatCard, encodeCursor } from '../utils';

const startTime = Date.now();

export interface ResolverContext {
  db: DatabaseService;
  loaders: DataLoaders;
  request: Request;
}

export function createResolvers(db: DatabaseService) {
  return {
    Query: {
      // ===== USER QUERIES =====
      user: (_: any, args: { id: string }) => {
        const user = db.findUserById(parseInt(args.id));
        if (!user) {
          throw new GraphQLError(`User with id ${args.id} not found`, {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return formatUser(user);
      },

      users: (_: any, args: { limit: number }) => {
        const users = db.findAllUsers();
        return users.slice(0, args.limit).map(formatUser);
      },

      // ===== SET QUERIES =====
      set: (_: any, args: { id: string }) => {
        const set = db.findSetById(args.id);
        if (!set) {
          throw new GraphQLError(`Set with id ${args.id} not found`, {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return formatSet(set);
      },

      sets: (_: any, args: { limit: number; offset: number }) => {
        const { total } = db.queryOne<{ total: number }>(
          'SELECT COUNT(*) as total FROM pokemon_card_sets'
        )!;

        const sets = db.query<any>(
          'SELECT * FROM pokemon_card_sets ORDER BY release_date DESC LIMIT ? OFFSET ?',
          args.limit,
          args.offset
        );
        const formattedSets = sets.map(formatSet);

        return {
          edges: formattedSets.map((set, index) => ({
            node: set,
            cursor: encodeCursor(args.offset + index)
          })),
          pageInfo: {
            hasNextPage: args.offset + args.limit < total,
            hasPreviousPage: args.offset > 0,
            startCursor:
              formattedSets.length > 0 ? encodeCursor(args.offset) : null,
            endCursor:
              formattedSets.length > 0
                ? encodeCursor(args.offset + formattedSets.length - 1)
                : null
          },
          totalCount: total
        };
      },

      setsBySeries: (_: any, args: { series: string }) => {
        const sets = db.findSetsBySeries(args.series);
        return sets.map(formatSet);
      },

      // ===== CARD QUERIES =====
      card: (_: any, args: { id: string }) => {
        const card = db.findCardById(args.id);
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

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const { total } = db.queryOne<{ total: number }>(
          `SELECT COUNT(*) as total FROM pokemon_cards ${whereClause}`,
          ...values
        )!;

        const cards = db.query<any>(
          `SELECT * FROM pokemon_cards ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
          ...values,
          args.limit,
          args.offset
        );
        const formattedCards = cards.map(formatCard);

        return {
          edges: formattedCards.map((card, index) => ({
            node: card,
            cursor: encodeCursor(args.offset + index)
          })),
          pageInfo: {
            hasNextPage: args.offset + args.limit < total,
            hasPreviousPage: args.offset > 0,
            startCursor:
              formattedCards.length > 0 ? encodeCursor(args.offset) : null,
            endCursor:
              formattedCards.length > 0
                ? encodeCursor(args.offset + formattedCards.length - 1)
                : null
          },
          totalCount: total
        };
      },

      cardsBySet: (
        _: any,
        args: { setId: string; limit: number; offset: number }
      ) => {
        const cards = db.findCardsBySetId(args.setId);
        return cards
          .slice(args.offset, args.offset + args.limit)
          .map(formatCard);
      },

      cardsByName: (_: any, args: { name: string }) => {
        const cards = db.findCardsByName(args.name);
        return cards.map(formatCard);
      },

      // ===== STATISTICS =====
      stats: () => {
        const cardCount = db.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM pokemon_cards'
        )!;
        const setCount = db.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM pokemon_card_sets'
        )!;
        const lastUpdated = db.queryOne<{ last: string }>(
          'SELECT MAX(updated_at) as last FROM pokemon_cards'
        )!;

        return {
          totalCards: cardCount.count,
          totalSets: setCount.count,
          lastUpdated: lastUpdated.last
        };
      },

      // ===== HEALTH CHECK =====
      health: () => {
        const dbHealthy = db.ping();
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
        return context.loaders.setLoader.load(parent.setId).then((set) => {
          if (!set) return null;
          return formatSet(set);
        });
      }
    },

    Set: {
      cards: (
        parent: any,
        args: { limit: number; offset: number },
        context: ResolverContext
      ) => {
        return context.loaders.cardsBySetLoader
          .load(parent.id)
          .then((cards) => {
            return cards
              .slice(args.offset, args.offset + args.limit)
              .map(formatCard);
          });
      },

      cardCount: (parent: any, _args: any, context: ResolverContext) => {
        return context.loaders.cardCountBySetLoader.load(parent.id);
      }
    }
  };
}
