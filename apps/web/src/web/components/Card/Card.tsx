import React from 'react';
import type { CardProps } from './types';
import { Badge } from '../Badge';
import './Card.css';

export function Card({
  card,
  variant = 'grid',
  onSelect,
  selected = false,
  className = ''
}: CardProps) {
  const classNames = [
    'pokemon-card',
    `pokemon-card--${variant}`,
    selected && 'pokemon-card--selected',
    onSelect && 'pokemon-card--clickable',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (onSelect) {
      onSelect(card);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(card);
    }
  };

  if (variant === 'list') {
    return (
      <div
        className={classNames}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onSelect ? 0 : undefined}
        role={onSelect ? 'button' : undefined}
      >
        <div className="pokemon-card__list-image">
          <img src={card.images.small} alt={card.name} loading="lazy" />
        </div>
        <div className="pokemon-card__list-content">
          <div className="pokemon-card__header">
            <h3 className="pokemon-card__name">{card.name}</h3>
            {card.hp && <span className="pokemon-card__hp">{card.hp} HP</span>}
          </div>
          <div className="pokemon-card__types">
            {card.types?.map((type) => (
              <Badge
                key={type}
                variant="type"
                pokemonType={type as any}
                size="small"
              >
                {type}
              </Badge>
            ))}
          </div>
          <div className="pokemon-card__meta">
            <span className="pokemon-card__set">{card.set.name}</span>
            <span className="pokemon-card__number">#{card.number}</span>
            {card.rarity && (
              <Badge variant="rarity" rarity={card.rarity as any} size="small">
                {card.rarity}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? 'button' : undefined}
    >
      <div className="pokemon-card__image">
        <img src={card.images.small} alt={card.name} loading="lazy" />
      </div>
      <div className="pokemon-card__content">
        <div className="pokemon-card__header">
          <h3 className="pokemon-card__name">{card.name}</h3>
          {card.hp && <span className="pokemon-card__hp">{card.hp} HP</span>}
        </div>
        {card.types && card.types.length > 0 && (
          <div className="pokemon-card__types">
            {card.types.map((type) => (
              <Badge
                key={type}
                variant="type"
                pokemonType={type as any}
                size="small"
              >
                {type}
              </Badge>
            ))}
          </div>
        )}
        {variant === 'detail' && (
          <>
            {card.subtypes && card.subtypes.length > 0 && (
              <div className="pokemon-card__subtypes">
                {card.subtypes.join(' • ')}
              </div>
            )}
            {card.attacks && card.attacks.length > 0 && (
              <div className="pokemon-card__attacks">
                <h4>Attacks</h4>
                {card.attacks.map((attack, idx) => (
                  <div key={idx} className="pokemon-card__attack">
                    <div className="pokemon-card__attack-header">
                      <span className="pokemon-card__attack-name">
                        {attack.name}
                      </span>
                      <span className="pokemon-card__attack-damage">
                        {attack.damage}
                      </span>
                    </div>
                    {attack.text && (
                      <p className="pokemon-card__attack-text">{attack.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div className="pokemon-card__footer">
          <span className="pokemon-card__set">{card.set.name}</span>
          {card.rarity && (
            <Badge variant="rarity" rarity={card.rarity as any} size="small">
              {card.rarity}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
