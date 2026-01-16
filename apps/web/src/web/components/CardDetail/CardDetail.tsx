import React from 'react';
import type { Pokemon } from '@pokemon/clients';
import type { CardDetailProps } from './types';
import { Badge } from '../Badge';
import './CardDetail.css';

export function CardDetail({
  card,
  onClose,
  onAddToCollection,
  onAddToDeck,
  collectionQuantity = 0,
  isModal = false,
  className = '',
}: CardDetailProps) {
  const classNames = [
    'card-detail',
    isModal && 'card-detail--modal',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleAddToCollection = () => {
    onAddToCollection?.(card);
  };

  const handleAddToDeck = () => {
    onAddToDeck?.(card);
  };

  return (
    <div className={classNames}>
      {/* Card Image */}
      <div className="card-detail__image-container">
        <img
          src={card.images?.large || card.images?.small}
          alt={card.name}
          className="card-detail__image"
          loading="lazy"
        />
        {collectionQuantity > 0 && (
          <div className="card-detail__quantity-badge">
            x{collectionQuantity}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="card-detail__info">
        {/* Header */}
        <div className="card-detail__header">
          <h2 className="card-detail__name">{card.name}</h2>
          {card.hp && (
            <span className="card-detail__hp">HP {card.hp}</span>
          )}
        </div>

        {/* Types & Subtypes */}
        <div className="card-detail__types">
          {card.supertype && (
            <Badge variant="primary">{card.supertype}</Badge>
          )}
          {card.subtypes?.map((subtype) => (
            <Badge key={subtype} variant="secondary">{subtype}</Badge>
          ))}
          {card.types?.map((type) => (
            <Badge key={type} variant="type" pokemonType={type.toLowerCase()}>
              {type}
            </Badge>
          ))}
        </div>

        {/* Attacks */}
        {card.attacks && card.attacks.length > 0 && (
          <div className="card-detail__section">
            <h3 className="card-detail__section-title">Attacks</h3>
            <div className="card-detail__attacks">
              {card.attacks.map((attack, index) => (
                <AttackDisplay key={index} attack={attack} />
              ))}
            </div>
          </div>
        )}

        {/* Rules/Abilities */}
        {card.rules && card.rules.length > 0 && (
          <div className="card-detail__section">
            <h3 className="card-detail__section-title">Rules</h3>
            <ul className="card-detail__rules">
              {card.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses & Resistances */}
        <div className="card-detail__combat">
          {card.weaknesses && card.weaknesses.length > 0 && (
            <div className="card-detail__weakness">
              <span className="card-detail__combat-label">Weakness</span>
              {card.weaknesses.map((w, i) => (
                <span key={i} className="card-detail__combat-value">
                  {w.type} {w.value}
                </span>
              ))}
            </div>
          )}
          {card.resistances && card.resistances.length > 0 && (
            <div className="card-detail__resistance">
              <span className="card-detail__combat-label">Resistance</span>
              {card.resistances.map((r, i) => (
                <span key={i} className="card-detail__combat-value">
                  {r.type} {r.value}
                </span>
              ))}
            </div>
          )}
          {card.retreatCost && card.retreatCost.length > 0 && (
            <div className="card-detail__retreat">
              <span className="card-detail__combat-label">Retreat Cost</span>
              <span className="card-detail__combat-value">
                {card.retreatCost.length}
              </span>
            </div>
          )}
        </div>

        {/* Set Info */}
        <div className="card-detail__set">
          <div className="card-detail__set-info">
            {card.set?.images?.symbol && (
              <img
                src={card.set.images.symbol}
                alt={card.set.name}
                className="card-detail__set-symbol"
              />
            )}
            <div>
              <div className="card-detail__set-name">{card.set?.name}</div>
              <div className="card-detail__set-number">
                #{card.number} / {card.set?.printedTotal}
              </div>
            </div>
          </div>
          {card.rarity && (
            <Badge variant="rarity" rarity={card.rarity.toLowerCase()}>
              {card.rarity}
            </Badge>
          )}
        </div>

        {/* Legality */}
        {card.legalities && (
          <div className="card-detail__legality">
            <span className="card-detail__legality-label">Legal in:</span>
            {card.legalities.unlimited && (
              <Badge variant={card.legalities.unlimited === 'Legal' ? 'success' : 'error'}>
                Unlimited
              </Badge>
            )}
            {card.legalities.expanded && (
              <Badge variant={card.legalities.expanded === 'Legal' ? 'success' : 'error'}>
                Expanded
              </Badge>
            )}
          </div>
        )}

        {/* Artist */}
        {card.artist && (
          <div className="card-detail__artist">
            Illustrated by <strong>{card.artist}</strong>
          </div>
        )}

        {/* Actions */}
        <div className="card-detail__actions">
          {onAddToCollection && (
            <button
              type="button"
              className="card-detail__action-btn card-detail__action-btn--primary"
              onClick={handleAddToCollection}
            >
              {collectionQuantity > 0 ? 'Add Another' : 'Add to Collection'}
            </button>
          )}
          {onAddToDeck && (
            <button
              type="button"
              className="card-detail__action-btn card-detail__action-btn--secondary"
              onClick={handleAddToDeck}
            >
              Add to Deck
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface AttackDisplayProps {
  attack: Pokemon.Attack;
}

function AttackDisplay({ attack }: AttackDisplayProps) {
  return (
    <div className="card-detail__attack">
      <div className="card-detail__attack-header">
        <div className="card-detail__attack-cost">
          {attack.cost?.map((energy, i) => (
            <span key={i} className={`energy-icon energy-icon--${energy.toLowerCase()}`}>
              {energy[0]}
            </span>
          ))}
        </div>
        <span className="card-detail__attack-name">{attack.name}</span>
        {attack.damage && (
          <span className="card-detail__attack-damage">{attack.damage}</span>
        )}
      </div>
      {attack.text && (
        <p className="card-detail__attack-text">{attack.text}</p>
      )}
    </div>
  );
}
