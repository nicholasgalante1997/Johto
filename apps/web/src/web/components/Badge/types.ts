export type PokemonType =
  | 'Colorless'
  | 'Darkness'
  | 'Dragon'
  | 'Fairy'
  | 'Fighting'
  | 'Fire'
  | 'Grass'
  | 'Lightning'
  | 'Metal'
  | 'Psychic'
  | 'Water';

export type RarityType =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Rare Holo'
  | 'Rare Ultra'
  | 'Rare Secret';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'type' | 'rarity' | 'default';
  pokemonType?: PokemonType;
  rarity?: RarityType;
  size?: 'small' | 'medium';
  className?: string;
}
