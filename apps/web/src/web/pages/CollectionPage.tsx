import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Library } from 'lucide-react';
import { useCollection } from '../contexts/Collection';
import { useCards } from '../hooks/useCards';
import { CardGrid } from '../components/CardGrid';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { CardDetail } from '../components/CardDetail';
import { ROUTES } from '../routes';
import type { Pokemon } from '@pokemon/clients';
import type { SearchFilters } from '../components/SearchBar/types';

function CollectionPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const {
    cards: collectionCards,
    totalCards,
    uniqueCards,
    addCard,
    removeCard,
    getQuantity
  } = useCollection();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Pokemon.Card | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Get card IDs from collection
  const collectionCardIds = useMemo(
    () => collectionCards.map((c) => c.cardId),
    [collectionCards]
  );

  // Fetch card details for collection cards
  // Note: In a real app, we'd have a more efficient way to fetch multiple cards by ID
  const { data: allCards, isLoading: loading } = useCards(1, 1000, {
    enabled: collectionCardIds.length > 0
  });

  // Filter to only cards in collection and apply search
  const displayCards = useMemo(() => {
    if (!allCards?.data?.length) return [];

    const inCollection = allCards?.data?.filter((card) =>
      collectionCardIds.includes(card.id)
    );

    if (!searchQuery) return inCollection;

    const query = searchQuery.toLowerCase();
    return inCollection.filter(
      (card) =>
        card.name.toLowerCase().includes(query) ||
        card.types?.some((t) => t.toLowerCase().includes(query)) ||
        card.rarity?.toLowerCase().includes(query)
    );
  }, [allCards, collectionCardIds, searchQuery]);

  // Paginate
  const paginatedCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayCards.slice(start, start + pageSize);
  }, [displayCards, page, pageSize]);

  const totalPages = Math.ceil(displayCards.length / pageSize);

  // Handle search
  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchQuery(filters.query);
    setPage(1);
  }, []);

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

  // Empty state
  if (collectionCards.length === 0) {
    return (
      <div className="page collection-page">
        <div className="page__header">
          <h1>My Collection</h1>
          <p>View and manage your Pokemon card collection.</p>
        </div>

        <div className="page__content">
          <div className="page__empty-state">
            <span className="page__empty-icon">
              <Library size={64} aria-hidden="true" />
            </span>
            <h2>Your collection is empty</h2>
            <p>Start browsing cards to add them to your collection.</p>
            <Link to={ROUTES.BROWSE} className="button button--primary">
              Browse Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page collection-page">
      <div className="page__header">
        <h1>My Collection</h1>
        <p>
          {totalCards} total cards ({uniqueCards} unique)
        </p>
      </div>

      {/* Toolbar */}
      <div className="collection-page__toolbar">
        <div className="collection-page__toolbar-left">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search your collection..."
          />
        </div>
      </div>

      {/* Card Grid */}
      <div className="page__content">
        <CardGrid
          cards={paginatedCards}
          onCardSelect={handleCardSelect}
          loading={loading}
          emptyMessage="No cards match your search."
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
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

export default CollectionPage;
