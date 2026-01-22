import React from 'react';
import { Badge } from '../Badge';
import type { DeckValidation as DeckValidationType } from '../../../types/deck';
import './DeckValidation.css';

export interface DeckValidationProps {
  /** Validation result */
  validation: DeckValidationType;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Show all errors and warnings */
  showDetails?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * Display deck validation status with errors and warnings
 */
export function DeckValidation({
  validation,
  showBreakdown = false,
  showDetails = true,
  compact = false
}: DeckValidationProps) {
  const { isValid, totalCards, errors, warnings, breakdown } = validation;

  if (compact) {
    return (
      <div className="deck-validation deck-validation--compact">
        <Badge variant={isValid ? 'success' : 'error'}>
          {isValid
            ? 'Valid'
            : `${errors.length} Error${errors.length !== 1 ? 's' : ''}`}
        </Badge>
        <span className="deck-validation__count">{totalCards}/60</span>
      </div>
    );
  }

  return (
    <div
      className={`deck-validation ${isValid ? 'deck-validation--valid' : 'deck-validation--invalid'}`}
    >
      <div className="deck-validation__header">
        <div className="deck-validation__status">
          <Badge variant={isValid ? 'success' : 'error'}>
            {isValid ? 'Valid Deck' : 'Invalid Deck'}
          </Badge>
          <span className="deck-validation__count-large">
            {totalCards}/60 cards
          </span>
        </div>
      </div>

      {showBreakdown && (
        <div className="deck-validation__breakdown">
          <div className="deck-validation__breakdown-item">
            <span className="deck-validation__breakdown-value">
              {breakdown.pokemon}
            </span>
            <span className="deck-validation__breakdown-label">Pokémon</span>
          </div>
          <div className="deck-validation__breakdown-item">
            <span className="deck-validation__breakdown-value">
              {breakdown.trainer}
            </span>
            <span className="deck-validation__breakdown-label">Trainers</span>
          </div>
          <div className="deck-validation__breakdown-item">
            <span className="deck-validation__breakdown-value">
              {breakdown.energy}
            </span>
            <span className="deck-validation__breakdown-label">Energy</span>
          </div>
          <div className="deck-validation__breakdown-item deck-validation__breakdown-item--highlight">
            <span className="deck-validation__breakdown-value">
              {breakdown.basicPokemon}
            </span>
            <span className="deck-validation__breakdown-label">Basic</span>
          </div>
        </div>
      )}

      {showDetails && errors.length > 0 && (
        <div className="deck-validation__errors">
          <h4 className="deck-validation__section-title">Errors</h4>
          <ul className="deck-validation__list">
            {errors.map((error, index) => (
              <li
                key={`${error.code}-${index}`}
                className="deck-validation__item deck-validation__item--error"
              >
                <span className="deck-validation__icon">{'✗'}</span>
                <span className="deck-validation__message">
                  {error.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDetails && warnings.length > 0 && (
        <div className="deck-validation__warnings">
          <h4 className="deck-validation__section-title">Warnings</h4>
          <ul className="deck-validation__list">
            {warnings.map((warning, index) => (
              <li
                key={`${warning.code}-${index}`}
                className="deck-validation__item deck-validation__item--warning"
              >
                <span className="deck-validation__icon">{'⚠'}</span>
                <span className="deck-validation__message">
                  {warning.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDetails && isValid && warnings.length === 0 && (
        <div className="deck-validation__success">
          <span className="deck-validation__icon">{'✓'}</span>
          <span className="deck-validation__message">
            Your deck meets all format requirements and is ready to play!
          </span>
        </div>
      )}
    </div>
  );
}
