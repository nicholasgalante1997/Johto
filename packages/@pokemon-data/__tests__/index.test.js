import { describe, test, expect, beforeAll } from 'bun:test';
import { getSets, getSet, getAllSetIds, getCardsInSet } from '../index.js';

let allSets;

describe('Pokemon Data API', () => {
  beforeAll(async () => {
    allSets = await getSets();
  });

  describe('getSets()', () => {
    test('should return an array', async () => {
      const sets = await getSets();
      expect(Array.isArray(sets)).toBe(true);
    });

    test('should return non-empty array', async () => {
      const sets = await getSets();
      expect(sets.length).toBeGreaterThan(0);
    });

    test('should return sets with required properties', async () => {
      const sets = await getSets();
      const firstSet = sets[0];

      expect(firstSet).toHaveProperty('id');
      expect(firstSet).toHaveProperty('name');
      expect(firstSet).toHaveProperty('series');
      expect(firstSet).toHaveProperty('printedTotal');
      expect(firstSet).toHaveProperty('total');
    });

    test('should return sets with valid structure', async () => {
      const sets = await getSets();
      sets.forEach((set) => {
        expect(typeof set.id).toBe('string');
        expect(typeof set.name).toBe('string');
        expect(typeof set.series).toBe('string');
        expect(typeof set.printedTotal).toBe('number');
        expect(typeof set.total).toBe('number');
      });
    });

    test('should consistently return the same data on multiple calls', async () => {
      const sets1 = await getSets();
      const sets2 = await getSets();

      expect(sets1.length).toBe(sets2.length);
      expect(sets1[0].id).toBe(sets2[0].id);
    });
  });

  describe('getSet()', () => {
    test('should return a set object when given a valid setId', async () => {
      const set = await getSet('base1');

      expect(set).not.toBeNull();
      expect(set).toHaveProperty('id');
      expect(set.id).toBe('base1');
    });

    test('should return null when given an invalid setId', async () => {
      const set = await getSet('invalid-set-id-12345');

      expect(set).toBeNull();
    });

    test('should return the correct set for "base2"', async () => {
      const set = await getSet('base2');

      expect(set).not.toBeNull();
      expect(set.id).toBe('base2');
      expect(set.name).toBe('Jungle');
    });

    test('should return a set with all required properties', async () => {
      const set = await getSet('base1');

      expect(set).toHaveProperty('id');
      expect(set).toHaveProperty('name');
      expect(set).toHaveProperty('series');
      expect(set).toHaveProperty('printedTotal');
      expect(set).toHaveProperty('total');
      expect(set).toHaveProperty('releaseDate');
      expect(set).toHaveProperty('images');
    });

    test('should return null for empty string setId', async () => {
      const set = await getSet('');

      expect(set).toBeNull();
    });

    test('should handle case-sensitive setIds', async () => {
      const set = await getSet('BASE1');

      expect(set).toBeNull();
    });

    test('should return the first matching set if duplicates exist', async () => {
      const set = await getSet('base1');
      const sets = await getSets();
      const expectedSet = sets.find((s) => s.id === 'base1');

      expect(set).toEqual(expectedSet);
    });
  });

  describe('getAllSetIds()', () => {
    test('should return an array', async () => {
      const ids = await getAllSetIds();

      expect(Array.isArray(ids)).toBe(true);
    });

    test('should return non-empty array', async () => {
      const ids = await getAllSetIds();

      expect(ids.length).toBeGreaterThan(0);
    });

    test('should return only strings', async () => {
      const ids = await getAllSetIds();

      ids.forEach((id) => {
        expect(typeof id).toBe('string');
      });
    });

    test('should return the same number of IDs as sets', async () => {
      const ids = await getAllSetIds();
      const sets = await getSets();

      expect(ids.length).toBe(sets.length);
    });

    test('should include known set IDs', async () => {
      const ids = await getAllSetIds();

      expect(ids).toContain('base1');
      expect(ids).toContain('base2');
    });

    test('should not contain duplicate IDs', async () => {
      const ids = await getAllSetIds();
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });

    test('should maintain consistent order across multiple calls', async () => {
      const ids1 = await getAllSetIds();
      const ids2 = await getAllSetIds();

      expect(ids1).toEqual(ids2);
    });
  });

  describe('getCardsInSet()', () => {
    test('should return an array for a valid setId', async () => {
      const cards = await getCardsInSet('base1');

      expect(Array.isArray(cards)).toBe(true);
    });

    test('should return non-empty array for base1 set', async () => {
      const cards = await getCardsInSet('base1');

      expect(cards.length).toBeGreaterThan(0);
    });

    test('should return cards with required properties', async () => {
      const cards = await getCardsInSet('base1');
      const firstCard = cards[0];

      expect(firstCard).toHaveProperty('id');
      expect(firstCard).toHaveProperty('name');
      expect(firstCard).toHaveProperty('supertype');
    });

    test('should return cards with valid structure', async () => {
      const cards = await getCardsInSet('base1');

      cards.forEach((card) => {
        expect(typeof card.id).toBe('string');
        expect(typeof card.name).toBe('string');
        expect(typeof card.supertype).toBe('string');
      });
    });

    test('should handle invalid setId gracefully', async () => {
      const cards = await getCardsInSet('invalid-set-12345');

      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBe(0);
    });

    test('should return empty array for non-existent set', async () => {
      const cards = await getCardsInSet('nonexistent');

      expect(cards).toEqual([]);
    });

    test('should return different cards for different sets', async () => {
      const cards1 = await getCardsInSet('base1');
      const cards2 = await getCardsInSet('base2');

      expect(cards1).not.toEqual(cards2);
    });

    test('should consistently return the same data on multiple calls', async () => {
      const cards1 = await getCardsInSet('base1');
      const cards2 = await getCardsInSet('base1');

      expect(cards1.length).toBe(cards2.length);
      if (cards1.length > 0) {
        expect(cards1[0].id).toBe(cards2[0].id);
      }
    });

    test('should handle empty string setId', async () => {
      const cards = await getCardsInSet('');

      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBe(0);
    });

    test('should verify cards belong to the correct set', async () => {
      const cards = await getCardsInSet('base1');

      if (cards.length > 0) {
        cards.forEach((card) => {
          expect(card.set.id).toBe('base1');
        });
      }
    });
  });

  describe('Integration tests', () => {
    test('should be able to get all sets and then fetch cards for each', async () => {
      const setIds = await getAllSetIds();
      const firstFewSetIds = setIds.slice(0, 3);

      for (const setId of firstFewSetIds) {
        const cards = await getCardsInSet(setId);
        expect(Array.isArray(cards)).toBe(true);
      }
    });

    test('should maintain data consistency between getSet and getSets', async () => {
      const sets = await getSets();
      const firstSetId = sets[0].id;
      const individualSet = await getSet(firstSetId);

      expect(individualSet).toEqual(sets[0]);
    });

    test('should have matching set information in cards', async () => {
      const set = await getSet('base1');
      const cards = await getCardsInSet('base1');

      if (cards.length > 0) {
        expect(cards[0].set.id).toBe(set.id);
        expect(cards[0].set.name).toBe(set.name);
      }
    });

    test('workflow: find set by ID, get all cards, verify structure', async () => {
      const setId = 'base1';

      const set = await getSet(setId);
      expect(set).not.toBeNull();
      expect(set.id).toBe(setId);

      const cards = await getCardsInSet(setId);
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);

      const firstCard = cards[0];
      expect(firstCard.set.id).toBe(setId);
    });
  });

  describe('Error handling', () => {
    test('should handle undefined setId in getSet', async () => {
      const set = await getSet(undefined);
      expect(set).toBeNull();
    });

    test('should handle null setId in getSet', async () => {
      const set = await getSet(null);
      expect(set).toBeNull();
    });

    test('should handle undefined setId in getCardsInSet', async () => {
      const cards = await getCardsInSet(undefined);
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBe(0);
    });

    test('should handle special characters in setId', async () => {
      const set = await getSet('base1!@#$%');
      expect(set).toBeNull();

      const cards = await getCardsInSet('base1!@#$%');
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBe(0);
    });
  });
});
