import React from 'react';
import type { BadgeProps } from './types';
import './Badge.css';

export function Badge({
  children,
  variant = 'default',
  pokemonType,
  rarity,
  size = 'medium',
  className = ''
}: BadgeProps) {
  const classNames = [
    'pokemon-badge',
    `pokemon-badge--${variant}`,
    `pokemon-badge--${size}`,
    pokemonType && `pokemon-badge--type-${pokemonType.toLowerCase()}`,
    rarity &&
      `pokemon-badge--rarity-${rarity.toLowerCase().replace(/\s+/g, '-')}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classNames}>{children}</span>;
}
