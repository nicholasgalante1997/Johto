import React, { useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useCards } from '../hooks/useCards';
import { useCollection } from '../context/CollectionContext';
import { CardGrid } from '../components/CardGrid';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { CardDetail } from '../components/CardDetail';
import { ROUTES } from '../routes';
import type { Pokemon } from '@pokemon/clients';
import type { SearchFilters } from '../components/SearchBar/types';
import './pages.css';

function BrowsePage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addCard, getQuantity } = useCollection();

  // Parse search params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('q') || undefined;
  const type = searchParams.get('type') || undefined;
  const rarity = searchParams.get('rarity') || undefined;

  // Fetch cards
  const { cards, loading, error, pagination } = useCards({
    page,
    limit: 20,
    search,
    type,
    rarity,
  });

  // Selected card for modal
  const [selectedCard, setSelectedCard] = useState<Pokemon.Card | null>(null);

  // Handle search
  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      const params = new URLSearchParams();
      if (filters.query) params.set('q', filters.query);
      if (filters.type) params.set('type', filters.type);
      if (filters.rarity) params.set('rarity', filters.rarity);
      params.set('page', '1');
      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', String(newPage));
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  // Handle card click
  const handleCardSelect = useCallback((card: Pokemon.Card) => {
    setSelectedCard(card);
  }, []);

  // Handle add to collection
  const handleAddToCollection = useCallback(
    (card: Pokemon.Card) => {
      addCard(card.id);
    },
    [addCard]
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  return (
    <div className="page browse-page">
      <div className="page__header">
        <h1>Browse Cards</h1>
        <p>Explore all available Pokemon cards.</p>
      </div>

      {/* Search Bar */}
      <div className="browse-page__toolbar">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search cards..."
          showFilters
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="browse-page__error">
          <p>Error loading cards: {error.message}</p>
          <button type="button" className="button button--primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {/* Card Grid */}
      <div className="page__content">
        <CardGrid
          cards={cards}
          onCardSelect={handleCardSelect}
          loading={loading}
          emptyMessage="No cards found. Try adjusting your search."
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <Modal
          isOpen={!!selectedCard}
          onClose={handleCloseModal}
          title={selectedCard.name}
          size="large"
        >
          <CardDetail
            card={selectedCard}
            onClose={handleCloseModal}
            onAddToCollection={handleAddToCollection}
            collectionQuantity={getQuantity(selectedCard.id)}
            isModal
          />
        </Modal>
      )}
    </div>
  );
}

export default BrowsePage;
