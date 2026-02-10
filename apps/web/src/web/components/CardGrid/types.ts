import type { Pokemon } from '@pokemon/clients';
import type { ReactNode } from 'react';

export interface CardGridProps {
  cards: Pokemon.Card[];
  onCardSelect?: (card: Pokemon.Card) => void;
  selectedCardIds?: string[];
  emptyMessage?: string;
  loading?: boolean;
  columns?: 'auto' | 2 | 3 | 4 | 5;
  className?: string;
  /** Optional function to render an overlay on each card */
  renderCardOverlay?: (card: Pokemon.Card) => ReactNode;
}
