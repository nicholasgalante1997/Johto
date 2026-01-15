import type { Pokemon } from '@pokemon/clients';

export interface CardProps {
  card: Pokemon.Card;
  variant?: 'grid' | 'list' | 'detail';
  onSelect?: (card: Pokemon.Card) => void;
  selected?: boolean;
  className?: string;
}
