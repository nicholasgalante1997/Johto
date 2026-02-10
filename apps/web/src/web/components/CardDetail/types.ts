import type { Pokemon } from '@pokemon/clients';

export interface CardDetailProps {
  /** The card to display */
  card: Pokemon.Card;
  /** Callback when close is requested */
  onClose: () => void;
  /** Callback when adding to collection */
  onAddToCollection?: (card: Pokemon.Card) => void;
  /** Callback when removing from collection */
  onRemoveFromCollection?: (card: Pokemon.Card) => void;
  /** Callback when adding to deck */
  onAddToDeck?: (card: Pokemon.Card) => void;
  /** Quantity in collection (if any) */
  collectionQuantity?: number;
  /** Whether this is displayed in a modal */
  isModal?: boolean;
  /** Additional class name */
  className?: string;
}
