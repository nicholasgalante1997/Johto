import { Database } from 'bun:sqlite';
import { sqlite } from '@pokemon/database';

import { formatCard, formatSet, formatUser } from './utils';

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

export default {
  resolvers: (db: Database) => ({
    Query: {
      // ===== USER QUERIES =====
      user: (_: any, args: { id: string }) => {
        try {
          const user = findUserById(db)(parseInt(args.id));
          if (!user) {
            throw new Error(`User with id ${args.id} not found`);
          }
          return formatUser(user);
        } catch (error) {
          console.error('Error fetching user:', error);
          throw error;
        }
      },

      users: (_: any, args: { limit: number }) => {
        try {
          const users = findAllUsers(db)();
          return users.slice(0, args.limit).map(formatUser);
        } catch (error) {
          console.error('Error fetching users:', error);
          throw error;
        }
      },

      // ===== SET QUERIES =====
      set: (_: any, args: { id: string }) => {
        try {
          const set = findSetById(db)(args.id);
          if (!set) {
            throw new Error(`Set with id ${args.id} not found`);
          }
          return formatSet(set);
        } catch (error) {
          console.error('Error fetching set:', error);
          throw error;
        }
      },

      sets: (_: any, args: { limit: number }) => {
        try {
          const sets = findAllSets(db)();
          return sets.slice(0, args.limit).map(formatSet);
        } catch (error) {
          console.error('Error fetching sets:', error);
          throw error;
        }
      },

      setsBySeries: (_: any, args: { series: string }) => {
        try {
          const sets = findSetsBySeries(db)(args.series);
          return sets.map(formatSet);
        } catch (error) {
          console.error('Error fetching sets by series:', error);
          throw error;
        }
      },

      // ===== CARD QUERIES =====
      card: (_: any, args: { id: string }) => {
        try {
          const card = findCardById(db)(args.id);
          if (!card) {
            throw new Error(`Card with id ${args.id} not found`);
          }
          return formatCard(card);
        } catch (error) {
          console.error('Error fetching card:', error);
          throw error;
        }
      },

      cardsBySet: (_: any, args: { setId: string }) => {
        try {
          const cards = findCardsBySetId(db)(args.setId);
          return cards.map(formatCard);
        } catch (error) {
          console.error('Error fetching cards by set:', error);
          throw error;
        }
      },

      cardsByName: (_: any, args: { name: string }) => {
        try {
          const cards = findCardsByName(db)(args.name);
          return cards.map(formatCard);
        } catch (error) {
          console.error('Error fetching cards by name:', error);
          throw error;
        }
      },

      cards: (_: any, args: { limit: number; offset: number }) => {
        try {
          const cards = findAllCards(db)(args.limit, args.offset);
          return cards.map(formatCard);
        } catch (error) {
          console.error('Error fetching all cards:', error);
          throw error;
        }
      }
    }
  })
};
