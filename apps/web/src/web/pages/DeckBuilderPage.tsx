import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDecks } from '../context/DeckContext';
import { useCards } from '../hooks/useCards';
import { useDeckValidation } from '../hooks/useDeckValidation';
import { CardGrid } from '../components/CardGrid';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { Badge } from '../components/Badge';
import { DeckValidation } from '../components/DeckValidation';
import { ROUTES } from '../routes';
import type { DeckFormat, DeckCard } from '../types/deck';
import type { Pokemon } from '@pokemon/clients';
import type { SearchFilters } from '../components/SearchBar/types';
import './pages.css';

function DeckBuilderPage() {
  const { deckId } = useParams<{ deckId?: string }>();
  const navigate = useNavigate();
  const { getDeck, createDeck, updateDeck } = useDecks();
  const isEditing = Boolean(deckId);

  // Get existing deck if editing
  const existingDeck = deckId ? getDeck(deckId) : undefined;

  // Deck state
  const [deckName, setDeckName] = useState(existingDeck?.name || '');
  const [deckDescription, setDeckDescription] = useState(existingDeck?.description || '');
  const [deckFormat, setDeckFormat] = useState<DeckFormat>(existingDeck?.format || 'standard');
  const [deckCards, setDeckCards] = useState<DeckCard[]>(existingDeck?.cards || []);
  const [isDirty, setIsDirty] = useState(false);

  // Card browser state
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Fetch cards for browser
  const { cards: allCards, loading, pagination } = useCards({
    page,
    limit: 20,
    search: searchQuery || undefined,
  });

  // Initialize from existing deck
  useEffect(() => {
    if (existingDeck) {
      setDeckName(existingDeck.name);
      setDeckDescription(existingDeck.description || '');
      setDeckFormat(existingDeck.format);
      setDeckCards(existingDeck.cards);
    }
  }, [existingDeck]);

  // Validate deck
  const validation = useDeckValidation(deckCards, allCards, deckFormat);
  const { totalCards, isValid } = validation;

  // Get card details for deck display
  const deckCardsWithDetails = useMemo(() => {
    return deckCards
      .map((deckCard) => {
        const cardDetail = allCards.find((c) => c.id === deckCard.cardId);
        return cardDetail ? { ...cardDetail, quantity: deckCard.quantity } : null;
      })
      .filter(Boolean) as Array<{ quantity: number } & Pokemon.Card>;
  }, [deckCards, allCards]);

  // Handle search
  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchQuery(filters.query);
    setPage(1);
  }, []);

  // Add card to deck
  const handleAddCard = useCallback((card: Pokemon.Card) => {
    setDeckCards((prev) => {
      const existing = prev.find((c) => c.cardId === card.id);
      if (existing) {
        // Check 4-of rule (basic energy exempt)
        const isBasicEnergy = card.supertype === 'Energy' && card.subtypes?.includes('Basic');
        if (!isBasicEnergy && existing.quantity >= 4) {
          return prev;
        }
        return prev.map((c) =>
          c.cardId === card.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { cardId: card.id, quantity: 1 }];
    });
    setIsDirty(true);
  }, []);

  // Remove card from deck
  const handleRemoveCard = useCallback((cardId: string) => {
    setDeckCards((prev) => {
      const existing = prev.find((c) => c.cardId === cardId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.cardId === cardId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.cardId !== cardId);
    });
    setIsDirty(true);
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    if (isEditing && deckId) {
      navigate(ROUTES.DECK_DETAIL(deckId));
    } else {
      navigate(ROUTES.DECKS);
    }
  }, [isDirty, isEditing, deckId, navigate]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!deckName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    if (isEditing && deckId) {
      updateDeck(deckId, {
        name: deckName,
        description: deckDescription || undefined,
        format: deckFormat,
        cards: deckCards,
      });
      navigate(ROUTES.DECK_DETAIL(deckId));
    } else {
      const newDeck = createDeck({
        name: deckName,
        description: deckDescription || undefined,
        format: deckFormat,
        cards: deckCards,
      });
      navigate(ROUTES.DECK_DETAIL(newDeck.id));
    }
  }, [deckName, deckDescription, deckFormat, deckCards, isEditing, deckId, createDeck, updateDeck, navigate]);

  return (
    <div className="page deck-builder-page">
      <div className="page__header deck-builder-page__header">
        <div className="deck-builder-page__header-left">
          <input
            type="text"
            className="deck-builder-page__name-input"
            placeholder="Deck Name"
            value={deckName}
            onChange={(e) => {
              setDeckName(e.target.value);
              setIsDirty(true);
            }}
          />
          <select
            className="deck-builder-page__format-select"
            value={deckFormat}
            onChange={(e) => {
              setDeckFormat(e.target.value as DeckFormat);
              setIsDirty(true);
            }}
          >
            <option value="standard">Standard</option>
            <option value="expanded">Expanded</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </div>
        <div className="deck-builder-page__header-center">
          <span className={`deck-builder-page__card-count ${isValid ? 'deck-builder-page__card-count--valid' : ''}`}>
            {totalCards}/60
          </span>
        </div>
        <div className="page__header-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={handleSave}
          >
            Save Deck
          </button>
        </div>
      </div>

      <div className="deck-builder-page__builder">
        {/* Card Browser Panel */}
        <div className="deck-builder-page__panel deck-builder-page__browser">
          <div className="deck-builder-page__panel-header">
            <h2>Card Browser</h2>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search cards..."
            />
          </div>
          <div className="deck-builder-page__panel-content">
            <CardGrid
              cards={allCards}
              onCardSelect={handleAddCard}
              loading={loading}
              columns={3}
              emptyMessage="No cards found"
            />
          </div>
          {pagination.totalPages > 1 && (
            <div className="deck-builder-page__panel-footer">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                siblingCount={0}
                showFirstLast={false}
              />
            </div>
          )}
        </div>

        {/* Deck Contents Panel */}
        <div className="deck-builder-page__panel deck-builder-page__deck">
          <div className="deck-builder-page__panel-header">
            <h2>Deck Contents</h2>
            <DeckValidation validation={validation} compact />
          </div>
          <div className="deck-builder-page__panel-content deck-builder-page__deck-list">
            {deckCards.length === 0 ? (
              <div className="deck-builder-page__empty">
                <p>Click cards to add them to your deck</p>
              </div>
            ) : (
              deckCardsWithDetails.map((card) => (
                <div key={card.id} className="deck-builder-page__deck-card">
                  <img
                    src={card.images?.small}
                    alt={card.name}
                    className="deck-builder-page__deck-card-image"
                  />
                  <div className="deck-builder-page__deck-card-info">
                    <span className="deck-builder-page__deck-card-name">{card.name}</span>
                    <div className="deck-builder-page__deck-card-controls">
                      <button
                        type="button"
                        className="deck-builder-page__qty-btn"
                        onClick={() => handleRemoveCard(card.id)}
                      >
                        -
                      </button>
                      <span className="deck-builder-page__qty">{card.quantity}</span>
                      <button
                        type="button"
                        className="deck-builder-page__qty-btn"
                        onClick={() => handleAddCard(card)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* Show cards without details */}
            {deckCards
              .filter((dc) => !deckCardsWithDetails.find((d) => d.id === dc.cardId))
              .map((dc) => (
                <div key={dc.cardId} className="deck-builder-page__deck-card deck-builder-page__deck-card--no-image">
                  <div className="deck-builder-page__deck-card-info">
                    <span className="deck-builder-page__deck-card-name">{dc.cardId}</span>
                    <div className="deck-builder-page__deck-card-controls">
                      <button
                        type="button"
                        className="deck-builder-page__qty-btn"
                        onClick={() => handleRemoveCard(dc.cardId)}
                      >
                        -
                      </button>
                      <span className="deck-builder-page__qty">{dc.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {deckCards.length > 0 && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="deck-builder-page__panel-footer deck-builder-page__validation">
              <DeckValidation
                validation={validation}
                showBreakdown={false}
                showDetails
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeckBuilderPage;
