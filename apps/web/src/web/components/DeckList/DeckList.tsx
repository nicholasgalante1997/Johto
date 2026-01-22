import React from 'react';
import type { DeckListProps } from './types';
import { DeckCard } from '../DeckCard';
import { Button } from '../Button';
import './DeckList.css';

export function DeckList({
  decks,
  onDeckSelect,
  onDeckEdit,
  onDeckDelete,
  onCreateNew,
  selectedDeckId,
  emptyMessage = 'No decks created yet',
  loading = false,
  layout = 'grid',
  className = ''
}: DeckListProps) {
  const classNames = [
    'pokemon-deck-list',
    `pokemon-deck-list--${layout}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className="pokemon-deck-list__loading">
        <div className="pokemon-deck-list__spinner" />
        <p>Loading decks...</p>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="pokemon-deck-list__empty">
        <div className="pokemon-deck-list__empty-icon">🎴</div>
        <h3 className="pokemon-deck-list__empty-title">{emptyMessage}</h3>
        {onCreateNew && (
          <Button variant="primary" size="large" onClick={onCreateNew}>
            Create Your First Deck
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="pokemon-deck-list-container">
      {onCreateNew && (
        <div className="pokemon-deck-list__header">
          <h2 className="pokemon-deck-list__title">
            My Decks{' '}
            <span className="pokemon-deck-list__count">({decks.length})</span>
          </h2>
          <Button variant="primary" size="medium" onClick={onCreateNew}>
            + New Deck
          </Button>
        </div>
      )}

      <div className={classNames}>
        {decks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onSelect={onDeckSelect}
            onEdit={onDeckEdit}
            onDelete={onDeckDelete}
            selected={deck.id === selectedDeckId}
          />
        ))}
      </div>
    </div>
  );
}
