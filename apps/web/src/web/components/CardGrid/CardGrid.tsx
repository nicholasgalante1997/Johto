import React from 'react';
import type { CardGridProps } from './types';
import { Card } from '../Card';
import './CardGrid.css';

export function CardGrid({
  cards,
  onCardSelect,
  selectedCardIds = [],
  emptyMessage = 'No cards found',
  loading = false,
  columns = 'auto',
  className = '',
  renderCardOverlay
}: CardGridProps) {
  const classNames = [
    'pokemon-card-grid',
    columns !== 'auto' && `pokemon-card-grid--columns-${columns}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className="pokemon-card-grid__loading">
        <div className="pokemon-card-grid__spinner" />
        <p>Loading cards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="pokemon-card-grid__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={classNames}>
      {cards.map((card) => (
        <div key={card.id} className="pokemon-card-grid__item">
          <Card
            card={card}
            variant="grid"
            onSelect={onCardSelect}
            selected={selectedCardIds.includes(card.id)}
          />
          {renderCardOverlay && renderCardOverlay(card)}
        </div>
      ))}
    </div>
  );
}
