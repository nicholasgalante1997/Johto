import React, { useState } from 'react';
import type { DeckCardProps } from './types';
import { Button } from '../Button';
import './DeckCard.css';

export function DeckCard({
  deck,
  onSelect,
  onEdit,
  onDelete,
  selected = false,
  className = '',
}: DeckCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const classNames = [
    'pokemon-deck-card',
    selected && 'pokemon-deck-card--selected',
    onSelect && 'pokemon-deck-card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (onSelect) {
      onSelect(deck);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(deck);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit) {
      onEdit(deck);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(deck);
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? 'button' : undefined}
    >
      {deck.coverCard ? (
        <div className="pokemon-deck-card__cover">
          <img
            src={deck.coverCard.imageUrl}
            alt={deck.coverCard.name}
            loading="lazy"
          />
          <div className="pokemon-deck-card__overlay" />
        </div>
      ) : (
        <div className="pokemon-deck-card__cover pokemon-deck-card__cover--empty">
          <span className="pokemon-deck-card__placeholder">🎴</span>
        </div>
      )}

      <div className="pokemon-deck-card__content">
        <div className="pokemon-deck-card__header">
          <h3 className="pokemon-deck-card__name">{deck.name}</h3>
          {(onEdit || onDelete) && (
            <div className="pokemon-deck-card__menu">
              <button
                className="pokemon-deck-card__menu-trigger"
                onClick={toggleMenu}
                aria-label="Deck options"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="pokemon-deck-card__menu-dropdown">
                  {onEdit && (
                    <button
                      className="pokemon-deck-card__menu-item"
                      onClick={handleEdit}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="pokemon-deck-card__menu-item pokemon-deck-card__menu-item--danger"
                      onClick={handleDelete}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {deck.description && (
          <p className="pokemon-deck-card__description">{deck.description}</p>
        )}

        <div className="pokemon-deck-card__footer">
          <div className="pokemon-deck-card__stats">
            <span className="pokemon-deck-card__stat">
              {deck.cardCount} cards
            </span>
            {deck.isValid !== undefined && (
              <span
                className={`pokemon-deck-card__status ${
                  deck.isValid ? 'pokemon-deck-card__status--valid' : 'pokemon-deck-card__status--invalid'
                }`}
              >
                {deck.isValid ? '✓ Valid' : '✗ Invalid'}
              </span>
            )}
          </div>
          <span className="pokemon-deck-card__date">
            {new Date(deck.lastModified).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
