import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  CollectionCard,
  CollectionStore,
  CollectionStats,
} from '../types/collection';
import {
  STORAGE_KEYS,
  COLLECTION_STORE_VERSION,
} from '../types/collection';

/**
 * Collection context value interface
 */
export interface CollectionContextValue {
  /** All cards in the collection */
  cards: CollectionCard[];
  /** Total number of cards (including duplicates) */
  totalCards: number;
  /** Number of unique cards */
  uniqueCards: number;
  /** Add a card to the collection */
  addCard: (cardId: string, quantity?: number) => void;
  /** Remove a card from the collection */
  removeCard: (cardId: string, quantity?: number) => void;
  /** Set the quantity of a specific card */
  setQuantity: (cardId: string, quantity: number) => void;
  /** Get the quantity of a specific card */
  getQuantity: (cardId: string) => number;
  /** Check if a card is in the collection */
  hasCard: (cardId: string) => boolean;
  /** Clear all cards from the collection */
  clear: () => void;
  /** Get collection statistics */
  getStats: () => CollectionStats;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

/**
 * Initial empty collection store
 */
const initialStore: CollectionStore = {
  version: COLLECTION_STORE_VERSION,
  cards: {},
};

interface CollectionProviderProps {
  children: React.ReactNode;
}

/**
 * Collection provider component
 */
export function CollectionProvider({ children }: CollectionProviderProps) {
  const [store, setStore] = useLocalStorage<CollectionStore>(
    STORAGE_KEYS.COLLECTION,
    initialStore
  );

  // Convert cards record to array
  const cards = useMemo(() => Object.values(store.cards), [store.cards]);

  // Calculate totals
  const totalCards = useMemo(
    () => cards.reduce((sum, card) => sum + card.quantity, 0),
    [cards]
  );

  const uniqueCards = useMemo(() => cards.length, [cards]);

  // Add card to collection
  const addCard = useCallback(
    (cardId: string, quantity: number = 1) => {
      setStore((prev) => {
        const existingCard = prev.cards[cardId];
        const newQuantity = (existingCard?.quantity || 0) + quantity;

        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: {
              cardId,
              quantity: newQuantity,
              dateAdded: existingCard?.dateAdded || new Date().toISOString(),
            },
          },
        };
      });
    },
    [setStore]
  );

  // Remove card from collection
  const removeCard = useCallback(
    (cardId: string, quantity: number = 1) => {
      setStore((prev) => {
        const existingCard = prev.cards[cardId];
        if (!existingCard) return prev;

        const newQuantity = existingCard.quantity - quantity;

        if (newQuantity <= 0) {
          // Remove card entirely
          const { [cardId]: _, ...remainingCards } = prev.cards;
          return {
            ...prev,
            cards: remainingCards,
          };
        }

        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: {
              ...existingCard,
              quantity: newQuantity,
            },
          },
        };
      });
    },
    [setStore]
  );

  // Set quantity directly
  const setQuantity = useCallback(
    (cardId: string, quantity: number) => {
      setStore((prev) => {
        if (quantity <= 0) {
          // Remove card entirely
          const { [cardId]: _, ...remainingCards } = prev.cards;
          return {
            ...prev,
            cards: remainingCards,
          };
        }

        const existingCard = prev.cards[cardId];
        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: {
              cardId,
              quantity,
              dateAdded: existingCard?.dateAdded || new Date().toISOString(),
            },
          },
        };
      });
    },
    [setStore]
  );

  // Get quantity of a card
  const getQuantity = useCallback(
    (cardId: string): number => {
      return store.cards[cardId]?.quantity || 0;
    },
    [store.cards]
  );

  // Check if card is in collection
  const hasCard = useCallback(
    (cardId: string): boolean => {
      return cardId in store.cards;
    },
    [store.cards]
  );

  // Clear all cards
  const clear = useCallback(() => {
    setStore(initialStore);
  }, [setStore]);

  // Get collection statistics
  const getStats = useCallback((): CollectionStats => {
    const sortedByDate = [...cards].sort(
      (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );

    return {
      totalCards,
      uniqueCards,
      byType: {}, // Would need card data to populate
      byRarity: {}, // Would need card data to populate
      recentlyAdded: sortedByDate.slice(0, 5),
    };
  }, [cards, totalCards, uniqueCards]);

  const value: CollectionContextValue = {
    cards,
    totalCards,
    uniqueCards,
    addCard,
    removeCard,
    setQuantity,
    getQuantity,
    hasCard,
    clear,
    getStats,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

/**
 * Hook to access collection context
 */
export function useCollection(): CollectionContextValue {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
}
