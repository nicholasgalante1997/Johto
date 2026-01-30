import DataLoader from 'dataloader';
import { Database } from 'bun:sqlite';
import { sqlite } from '@pokemon/database';

/**
 * Create DataLoaders for batching database queries
 * DataLoaders are request-scoped to prevent caching across requests
 */
export function createDataLoaders(db: Database) {
  /**
   * Batch load sets by IDs
   */
  const setLoader = new DataLoader<string, any>(async (ids) => {
    const placeholders = ids.map(() => '?').join(',');
    const query = db.query(`
      SELECT * FROM pokemon_card_sets
      WHERE id IN (${placeholders})
    `);
    const sets = query.all(...ids) as any[];

    // Create a map for O(1) lookup
    const setMap = new Map(sets.map((s) => [s.id, s]));

    // Return in the same order as requested
    return ids.map((id) => setMap.get(id) || null);
  });

  /**
   * Batch load cards by IDs
   */
  const cardLoader = new DataLoader<string, any>(async (ids) => {
    const placeholders = ids.map(() => '?').join(',');
    const query = db.query(`
      SELECT * FROM pokemon_cards
      WHERE id IN (${placeholders})
    `);
    const cards = query.all(...ids) as any[];

    const cardMap = new Map(cards.map((c) => [c.id, c]));
    return ids.map((id) => cardMap.get(id) || null);
  });

  /**
   * Batch load card count by set IDs
   */
  const cardCountBySetLoader = new DataLoader<string, number>(async (setIds) => {
    const placeholders = setIds.map(() => '?').join(',');
    const query = db.query(`
      SELECT set_id, COUNT(*) as count
      FROM pokemon_cards
      WHERE set_id IN (${placeholders})
      GROUP BY set_id
    `);
    const counts = query.all(...setIds) as { set_id: string; count: number }[];

    const countMap = new Map(counts.map((c) => [c.set_id, c.count]));
    return setIds.map((id) => countMap.get(id) || 0);
  });

  /**
   * Batch load cards by set ID
   */
  const cardsBySetLoader = new DataLoader<string, any[]>(async (setIds) => {
    const placeholders = setIds.map(() => '?').join(',');
    const query = db.query(`
      SELECT * FROM pokemon_cards
      WHERE set_id IN (${placeholders})
      ORDER BY set_id, CAST(number AS INTEGER) ASC
    `);
    const cards = query.all(...setIds) as any[];

    // Group cards by set_id
    const cardsBySet = new Map<string, any[]>();
    for (const card of cards) {
      const setCards = cardsBySet.get(card.set_id) || [];
      setCards.push(card);
      cardsBySet.set(card.set_id, setCards);
    }

    return setIds.map((id) => cardsBySet.get(id) || []);
  });

  return {
    setLoader,
    cardLoader,
    cardCountBySetLoader,
    cardsBySetLoader
  };
}

export type DataLoaders = ReturnType<typeof createDataLoaders>;
