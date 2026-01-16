import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDecks } from '../context/DeckContext';
import { DeckList } from '../components/DeckList';
import { Modal } from '../components/Modal';
import { ROUTES } from '../routes';
import type { DeckFormat, FORMAT_NAMES } from '../types/deck';
import './pages.css';

function DecksPage() {
  const navigate = useNavigate();
  const { decks, deleteDeck, deckCount } = useDecks();
  const [formatFilter, setFormatFilter] = useState<DeckFormat | 'all'>('all');
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  // Filter decks by format
  const filteredDecks = formatFilter === 'all'
    ? decks
    : decks.filter((deck) => deck.format === formatFilter);

  // Convert decks to DeckList format
  const deckItems = filteredDecks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    description: deck.description,
    cardCount: deck.cards.reduce((sum, c) => sum + c.quantity, 0),
    isValid: deck.cards.reduce((sum, c) => sum + c.quantity, 0) === 60,
    lastModified: deck.updatedAt,
  }));

  // Handle deck edit
  const handleEdit = useCallback(
    (deck: { id: string }) => {
      navigate(ROUTES.DECK_EDIT(deck.id));
    },
    [navigate]
  );

  // Handle deck delete
  const handleDelete = useCallback((deck: { id: string }) => {
    setDeckToDelete(deck.id);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (deckToDelete) {
      deleteDeck(deckToDelete);
      setDeckToDelete(null);
    }
  }, [deckToDelete, deleteDeck]);

  // Handle deck click
  const handleDeckClick = useCallback(
    (deckId: string) => {
      navigate(ROUTES.DECK_DETAIL(deckId));
    },
    [navigate]
  );

  // Empty state
  if (deckCount === 0) {
    return (
      <div className="page decks-page">
        <div className="page__header">
          <h1>My Decks</h1>
          <p>Manage your Pokemon TCG decks.</p>
        </div>

        <div className="page__content">
          <div className="page__empty-state">
            <span className="page__empty-icon">{'\u{1F3B4}'}</span>
            <h2>No decks yet</h2>
            <p>Create your first deck to get started.</p>
            <Link to={ROUTES.DECK_NEW} className="button button--primary">
              Create Deck
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page decks-page">
      <div className="page__header">
        <h1>My Decks</h1>
        <p>{deckCount} deck{deckCount !== 1 ? 's' : ''}</p>
        <div className="page__header-actions">
          <Link to={ROUTES.DECK_NEW} className="button button--primary">
            + Create New Deck
          </Link>
        </div>
      </div>

      {/* Format Filter */}
      <div className="decks-page__toolbar">
        <div className="decks-page__format-filter">
          <button
            type="button"
            className={`decks-page__filter-btn ${formatFilter === 'all' ? 'decks-page__filter-btn--active' : ''}`}
            onClick={() => setFormatFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`decks-page__filter-btn ${formatFilter === 'standard' ? 'decks-page__filter-btn--active' : ''}`}
            onClick={() => setFormatFilter('standard')}
          >
            Standard
          </button>
          <button
            type="button"
            className={`decks-page__filter-btn ${formatFilter === 'expanded' ? 'decks-page__filter-btn--active' : ''}`}
            onClick={() => setFormatFilter('expanded')}
          >
            Expanded
          </button>
          <button
            type="button"
            className={`decks-page__filter-btn ${formatFilter === 'unlimited' ? 'decks-page__filter-btn--active' : ''}`}
            onClick={() => setFormatFilter('unlimited')}
          >
            Unlimited
          </button>
        </div>
      </div>

      {/* Deck List */}
      <div className="page__content">
        <DeckList
          decks={deckItems}
          onDeckEdit={handleEdit}
          onDeckDelete={handleDelete}
          onDeckSelect={(deck) => handleDeckClick(deck.id)}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deckToDelete}
        onClose={() => setDeckToDelete(null)}
        title="Delete Deck"
        size="small"
        footer={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setDeckToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this deck? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default DecksPage;
