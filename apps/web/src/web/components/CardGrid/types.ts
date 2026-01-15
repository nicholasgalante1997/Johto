import type { Pokemon } from '@pokemon/clients';

export interface CardGridProps {
  cards: Pokemon.Card[];
  onCardSelect?: (card: Pokemon.Card) => void;
  selectedCardIds?: string[];
  emptyMessage?: string;
  loading?: boolean;
  columns?: 'auto' | 2 | 3 | 4 | 5;
  className?: string;
}
