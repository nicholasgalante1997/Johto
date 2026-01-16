import React, { useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDecks } from '../context/DeckContext';
import { useCards } from '../hooks/useCards';
import { useDeckValidation } from '../hooks/useDeckValidation';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { DeckValidation } from '../components/DeckValidation';
import { ROUTES } from '../routes';
import { FORMAT_NAMES } from '../types/deck';
import './pages.css';

function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { getDeck, deleteDeck } = useDecks();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get the deck
  const deck = deckId ? getDeck(deckId) : undefined;

  // Fetch card details
  const { cards: allCards, loading } = useCards({ limit: 100 });

  // Get card details for deck cards
  const deckCardsWithDetails = useMemo(() => {
    if (!deck || !allCards.length) return [];

    return deck.cards
      .map((deckCard) => {
        const cardDetail = allCards.find((c) => c.id === deckCard.cardId);
        return cardDetail ? { ...cardDetail, quantity: deckCard.quantity } : null;
      })
      .filter(Boolean) as Array<{ quantity: number } & typeof allCards[0]>;
  }, [deck, allCards]);

  // Group cards by supertype
  const groupedCards = useMemo(() => {
    const groups: Record<string, typeof deckCardsWithDetails> = {
      Pokemon: [],
      Trainer: [],
      Energy: [],
    };

    deckCardsWithDetails.forEach((card) => {
      const supertype = card.supertype || 'Other';
      if (!groups[supertype]) groups[supertype] = [];
      groups[supertype].push(card);
    });

    return groups;
  }, [deckCardsWithDetails]);

  // Validate deck
  const validation = useDeckValidation(
    deck?.cards || [],
    allCards,
    deck?.format || 'standard'
  );
  const { totalCards, isValid } = validation;

  // Handle delete
  const handleDelete = useCallback(() => {
    if (deckId) {
      deleteDeck(deckId);
      navigate(ROUTES.DECKS);
    }
  }, [deckId, deleteDeck, navigate]);

  // Deck not found
  if (!deck) {
    return (
      <div className="page deck-detail-page">
        <div className="page__header">
          <h1>Deck Not Found</h1>
        </div>
        <div className="page__content">
          <div className="page__empty-state">
            <span className="page__empty-icon">{'\u{1F3B4}'}</span>
            <h2>Deck not found</h2>
            <p>The deck you're looking for doesn't exist.</p>
            <Link to={ROUTES.DECKS} className="button button--primary">
              Back to Decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page deck-detail-page">
      <div className="page__header">
        <div className="deck-detail-page__header-content">
          <h1>{deck.name}</h1>
          <div className="deck-detail-page__meta">
            <Badge variant="primary">{FORMAT_NAMES[deck.format]}</Badge>
            <span className="deck-detail-page__card-count">
              {totalCards}/60 cards
            </span>
            <Badge variant={isValid ? 'success' : 'warning'}>
              {isValid ? 'Valid' : 'Incomplete'}
            </Badge>
          </div>
          {deck.description && (
            <p className="deck-detail-page__description">{deck.description}</p>
          )}
        </div>
        <div className="page__header-actions">
          <Link to={ROUTES.DECK_EDIT(deckId!)} className="button button--secondary">
            Edit Deck
          </Link>
          <button
            type="button"
            className="button button--danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Deck Stats */}
      <div className="deck-detail-page__stats">
        <div className="deck-detail-page__stat">
          <span className="deck-detail-page__stat-value">
            {validation.breakdown.pokemon}
          </span>
          <span className="deck-detail-page__stat-label">Pokemon</span>
        </div>
        <div className="deck-detail-page__stat">
          <span className="deck-detail-page__stat-value">
            {validation.breakdown.trainer}
          </span>
          <span className="deck-detail-page__stat-label">Trainers</span>
        </div>
        <div className="deck-detail-page__stat">
          <span className="deck-detail-page__stat-value">
            {validation.breakdown.energy}
          </span>
          <span className="deck-detail-page__stat-label">Energy</span>
        </div>
        <div className="deck-detail-page__stat deck-detail-page__stat--highlight">
          <span className="deck-detail-page__stat-value">
            {validation.breakdown.basicPokemon}
          </span>
          <span className="deck-detail-page__stat-label">Basic</span>
        </div>
      </div>

      {/* Validation Status */}
      {!loading && deck.cards.length > 0 && (
        <div className="deck-detail-page__validation">
          <DeckValidation
            validation={validation}
            showBreakdown={false}
            showDetails
          />
        </div>
      )}

      {/* Card Groups */}
      <div className="page__content">
        {loading ? (
          <div className="deck-detail-page__loading">Loading card details...</div>
        ) : (
          Object.entries(groupedCards).map(([supertype, cards]) => {
            if (!cards.length) return null;
            const groupTotal = cards.reduce((sum, c) => sum + c.quantity, 0);

            return (
              <div key={supertype} className="deck-detail-page__group">
                <h2 className="deck-detail-page__group-title">
                  {supertype} ({groupTotal})
                </h2>
                <div className="deck-detail-page__card-list">
                  {cards.map((card) => (
                    <div key={card.id} className="deck-detail-page__card-item">
                      <img
                        src={card.images?.small}
                        alt={card.name}
                        className="deck-detail-page__card-image"
                      />
                      <div className="deck-detail-page__card-info">
                        <span className="deck-detail-page__card-name">{card.name}</span>
                        <span className="deck-detail-page__card-quantity">x{card.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {!loading && deckCardsWithDetails.length === 0 && deck.cards.length > 0 && (
          <div className="deck-detail-page__no-details">
            <p>Card details could not be loaded. The deck contains {deck.cards.length} card entries.</p>
          </div>
        )}

        {deck.cards.length === 0 && (
          <div className="page__empty-state">
            <span className="page__empty-icon">{'\u{1F3B4}'}</span>
            <h2>Empty Deck</h2>
            <p>This deck has no cards yet.</p>
            <Link to={ROUTES.DECK_EDIT(deckId!)} className="button button--primary">
              Add Cards
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deck"
        size="small"
        footer={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete "{deck.name}"? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default DeckDetailPage;
