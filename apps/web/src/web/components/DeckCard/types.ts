export interface Deck {
  id: string;
  name: string;
  description?: string;
  cardCount: number;
  lastModified: string;
  isValid?: boolean;
  coverCard?: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

export interface DeckCardProps {
  deck: Deck;
  onSelect?: (deck: Deck) => void;
  onEdit?: (deck: Deck) => void;
  onDelete?: (deck: Deck) => void;
  selected?: boolean;
  className?: string;
}
