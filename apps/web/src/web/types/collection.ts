/**
 * Represents a card in the user's collection with quantity
 */
export interface CollectionCard {
  cardId: string;
  quantity: number;
  dateAdded: string;
}

/**
 * Collection store structure for localStorage persistence
 */
export interface CollectionStore {
  version: number;
  cards: Record<string, CollectionCard>;
}

/**
 * Collection statistics for dashboard display
 */
export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  byType: Record<string, number>;
  byRarity: Record<string, number>;
  recentlyAdded: CollectionCard[];
}

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  COLLECTION: 'pokemon-tcg-collection',
  DECKS: 'pokemon-tcg-decks',
  PREFERENCES: 'pokemon-tcg-preferences',
} as const;

/**
 * Current collection store version for migrations
 */
export const COLLECTION_STORE_VERSION = 1;
