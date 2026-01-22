import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Deck, DeckCard, DeckFormat, DeckStore } from '../../types/deck';
import { DECK_STORE_VERSION } from '../../types/deck';
import { STORAGE_KEYS } from '../../types/collection';

/**
 * Deck context value interface
 */
export interface DeckContextValue {
  /** All decks */
  decks: Deck[];
  /** Currently selected deck for editing */
  currentDeck: Deck | null;
  /** Create a new deck */
  createDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => Deck;
  /** Update an existing deck */
  updateDeck: (
    id: string,
    updates: Partial<Omit<Deck, 'id' | 'createdAt'>>
  ) => void;
  /** Delete a deck */
  deleteDeck: (id: string) => void;
  /** Get a deck by ID */
  getDeck: (id: string) => Deck | undefined;
  /** Set the current deck for editing */
  setCurrentDeck: (id: string | null) => void;
  /** Add a card to a deck */
  addCardToDeck: (deckId: string, cardId: string, quantity?: number) => void;
  /** Remove a card from a deck */
  removeCardFromDeck: (
    deckId: string,
    cardId: string,
    quantity?: number
  ) => void;
  /** Set card quantity in a deck */
  setCardQuantityInDeck: (
    deckId: string,
    cardId: string,
    quantity: number
  ) => void;
  /** Get total deck count */
  deckCount: number;
  /** Get decks by format */
  getDecksByFormat: (format: DeckFormat) => Deck[];
}

const DeckContext = createContext<DeckContextValue | null>(null);

/**
 * Initial empty deck store
 */
const initialStore: DeckStore = {
  version: DECK_STORE_VERSION,
  decks: {}
};

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `deck-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface DeckProviderProps {
  children: React.ReactNode;
}

/**
 * Deck provider component
 */
export function DeckProvider({ children }: DeckProviderProps) {
  const [store, setStore] = useLocalStorage<DeckStore>(
    STORAGE_KEYS.DECKS,
    initialStore
  );
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);

  // Convert decks record to array
  const decks = useMemo(() => Object.values(store.decks), [store.decks]);

  // Get current deck
  const currentDeck = useMemo(
    () => (currentDeckId ? store.decks[currentDeckId] || null : null),
    [currentDeckId, store.decks]
  );

  // Create a new deck
  const createDeck = useCallback(
    (deckData: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Deck => {
      const id = generateId();
      const now = new Date().toISOString();
      const newDeck: Deck = {
        ...deckData,
        id,
        createdAt: now,
        updatedAt: now
      };

      setStore((prev) => ({
        ...prev,
        decks: {
          ...prev.decks,
          [id]: newDeck
        }
      }));

      return newDeck;
    },
    [setStore]
  );

  // Update an existing deck
  const updateDeck = useCallback(
    (id: string, updates: Partial<Omit<Deck, 'id' | 'createdAt'>>) => {
      setStore((prev) => {
        const existingDeck = prev.decks[id];
        if (!existingDeck) return prev;

        return {
          ...prev,
          decks: {
            ...prev.decks,
            [id]: {
              ...existingDeck,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          }
        };
      });
    },
    [setStore]
  );

  // Delete a deck
  const deleteDeck = useCallback(
    (id: string) => {
      setStore((prev) => {
        const { [id]: _, ...remainingDecks } = prev.decks;
        return {
          ...prev,
          decks: remainingDecks
        };
      });

      // Clear current deck if it was deleted
      if (currentDeckId === id) {
        setCurrentDeckId(null);
      }
    },
    [setStore, currentDeckId]
  );

  // Get a deck by ID
  const getDeck = useCallback(
    (id: string): Deck | undefined => {
      return store.decks[id];
    },
    [store.decks]
  );

  // Set current deck for editing
  const setCurrentDeck = useCallback((id: string | null) => {
    setCurrentDeckId(id);
  }, []);

  // Add a card to a deck
  const addCardToDeck = useCallback(
    (deckId: string, cardId: string, quantity: number = 1) => {
      setStore((prev) => {
        const deck = prev.decks[deckId];
        if (!deck) return prev;

        const existingCardIndex = deck.cards.findIndex(
          (c) => c.cardId === cardId
        );
        let newCards: DeckCard[];

        if (existingCardIndex >= 0) {
          newCards = deck.cards.map((card, index) =>
            index === existingCardIndex
              ? { ...card, quantity: card.quantity + quantity }
              : card
          );
        } else {
          newCards = [...deck.cards, { cardId, quantity }];
        }

        return {
          ...prev,
          decks: {
            ...prev.decks,
            [deckId]: {
              ...deck,
              cards: newCards,
              updatedAt: new Date().toISOString()
            }
          }
        };
      });
    },
    [setStore]
  );

  // Remove a card from a deck
  const removeCardFromDeck = useCallback(
    (deckId: string, cardId: string, quantity: number = 1) => {
      setStore((prev) => {
        const deck = prev.decks[deckId];
        if (!deck) return prev;

        const newCards = deck.cards
          .map((card) => {
            if (card.cardId !== cardId) return card;
            const newQuantity = card.quantity - quantity;
            return newQuantity > 0 ? { ...card, quantity: newQuantity } : null;
          })
          .filter((card): card is DeckCard => card !== null);

        return {
          ...prev,
          decks: {
            ...prev.decks,
            [deckId]: {
              ...deck,
              cards: newCards,
              updatedAt: new Date().toISOString()
            }
          }
        };
      });
    },
    [setStore]
  );

  // Set card quantity in a deck
  const setCardQuantityInDeck = useCallback(
    (deckId: string, cardId: string, quantity: number) => {
      setStore((prev) => {
        const deck = prev.decks[deckId];
        if (!deck) return prev;

        let newCards: DeckCard[];

        if (quantity <= 0) {
          // Remove card
          newCards = deck.cards.filter((c) => c.cardId !== cardId);
        } else {
          const existingCardIndex = deck.cards.findIndex(
            (c) => c.cardId === cardId
          );
          if (existingCardIndex >= 0) {
            newCards = deck.cards.map((card, index) =>
              index === existingCardIndex ? { ...card, quantity } : card
            );
          } else {
            newCards = [...deck.cards, { cardId, quantity }];
          }
        }

        return {
          ...prev,
          decks: {
            ...prev.decks,
            [deckId]: {
              ...deck,
              cards: newCards,
              updatedAt: new Date().toISOString()
            }
          }
        };
      });
    },
    [setStore]
  );

  // Get decks by format
  const getDecksByFormat = useCallback(
    (format: DeckFormat): Deck[] => {
      return decks.filter((deck) => deck.format === format);
    },
    [decks]
  );

  const value: DeckContextValue = {
    decks,
    currentDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    getDeck,
    setCurrentDeck,
    addCardToDeck,
    removeCardFromDeck,
    setCardQuantityInDeck,
    deckCount: decks.length,
    getDecksByFormat
  };

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

/**
 * Hook to access deck context
 */
export function useDecks(): DeckContextValue {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error('useDecks must be used within a DeckProvider');
  }
  return context;
}
