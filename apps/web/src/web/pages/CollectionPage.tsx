import React, { useState, useCallback, useMemo } from 'react';
import { Library, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useCollection } from '../contexts/Collection';
import {
  useSearchCards,
  toCardFormat,
  useCollectionCardsData,
  cardToDisplayFormat
} from '../hooks';
import { CardGrid } from '../components/CardGrid';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { CardDetail } from '../components/CardDetail';
import type { Pokemon } from '@pokemon/clients';
import type { SearchFilters } from '../components/SearchBar/types';

function CollectionPage() {
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Fetch card data for collection
  const { cards: collectionCardsData, isLoading: collectionLoading } =
    useCollectionCardsData(collectionCards);

  // Convert collection cards to display format
  const displayCollectionCards: Pokemon.Card[] = useMemo(() => {
    return collectionCardsData.map((card) => {
      const formatted = cardToDisplayFormat(card);
      return {
        ...formatted,
        images: formatted.images
      } as unknown as Pokemon.Card;
    });
  }, [collectionCardsData]);

  // Search cards with debouncing - for adding new cards
  const {
    cards: searchResults,
    isLoading: searchLoading,
    error,
    isError
  } = useSearchCards(searchQuery, { limit: 100, enabled: isSearchExpanded });

  // Convert search results to Pokemon.Card format
  const searchCards: Pokemon.Card[] = useMemo(() => {
    if (error || isError) return [];
    if (!searchResults) return [];

    return searchResults.map((card) => {
      const formatted = toCardFormat(card);
      return {
        ...formatted,
        images: formatted.images
      } as unknown as Pokemon.Card;
    });
  }, [searchResults, error, isError]);

  // Handle search
  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchQuery(filters.query);
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

  // Handle remove from collection
  const handleRemoveFromCollection = useCallback(
    (card: Pokemon.Card) => {
      removeCard(card.id);
    },
    [removeCard]
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  // Toggle search section
  const toggleSearch = useCallback(() => {
    setIsSearchExpanded((prev) => !prev);
  }, []);

  return (
    <div className="page collection-page">
      <div className="page__header">
        <h1>My Collection</h1>
        <p>
          {totalCards} total cards ({uniqueCards} unique)
        </p>
      </div>

      {/* Collection Section */}
      <section className="collection-page__section">
        <div className="page__content">
          {uniqueCards === 0 ? (
            <div className="page__empty-state">
              <span className="page__empty-icon">
                <Library size={48} aria-hidden="true" />
              </span>
              <h2>Your collection is empty</h2>
              <p>
                Search for cards below and click them to add to your collection.
              </p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => setIsSearchExpanded(true)}
              >
                Search for Cards
              </button>
            </div>
          ) : (
            <CardGrid
              cards={displayCollectionCards}
              onCardSelect={handleCardSelect}
              loading={collectionLoading}
              emptyMessage="Loading your collection..."
              renderCardOverlay={(card) => {
                const quantity = getQuantity(card.id);
                if (quantity > 0) {
                  return (
                    <div className="collection-page__card-quantity">
                      <span className="collection-page__quantity-badge">
                        {quantity}x
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </div>
      </section>

      {/* Add More Cards Section */}
      <section className="collection-page__add-section">
        <button
          type="button"
          className="collection-page__add-header"
          onClick={toggleSearch}
          aria-expanded={isSearchExpanded}
        >
          <div className="collection-page__add-header-content">
            <Search size={20} aria-hidden="true" />
            <span>Add More Cards</span>
          </div>
          {isSearchExpanded ? (
            <ChevronUp size={20} aria-hidden="true" />
          ) : (
            <ChevronDown size={20} aria-hidden="true" />
          )}
        </button>

        {isSearchExpanded && (
          <div className="collection-page__add-content">
            <div className="collection-page__search-bar">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search for cards to add..."
              />
            </div>

            <div className="collection-page__search-results">
              <CardGrid
                cards={searchCards}
                onCardSelect={handleCardSelect}
                loading={searchLoading}
                emptyMessage={
                  searchQuery.trim()
                    ? `No cards found for "${searchQuery}"`
                    : 'Start typing to search for cards'
                }
                renderCardOverlay={(card) => {
                  const quantity = getQuantity(card.id);
                  if (quantity > 0) {
                    return (
                      <div className="collection-page__card-quantity">
                        <span className="collection-page__quantity-badge">
                          {quantity}x
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </div>
          </div>
        )}
      </section>

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
            onRemoveFromCollection={handleRemoveFromCollection}
            collectionQuantity={getQuantity(selectedCard.id)}
            isModal
          />
        </Modal>
      )}
    </div>
  );
}

export default CollectionPage;
