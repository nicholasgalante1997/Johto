import type { Deck } from '../DeckCard/types';

export interface DeckListProps {
  decks: Deck[];
  onDeckSelect?: (deck: Deck) => void;
  onDeckEdit?: (deck: Deck) => void;
  onDeckDelete?: (deck: Deck) => void;
  onCreateNew?: () => void;
  selectedDeckId?: string;
  emptyMessage?: string;
  loading?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}
