/**
 * EXAMPLE: USING GRAPHQL HOOKS WITH REACT-QUERY
 *
 * This example demonstrates how to use the GraphQL hooks in React components
 * for querying and mutating Pokemon card data
 */

import React, { useState } from 'react';
import {
  useCards,
  useCardsBySet,
  useCardsByName,
  useCard,
  useCreateCard,
  useDeleteCard
} from '../hooks';
import type { Card } from '../types';

/**
 * Example 1: Fetching paginated cards
 */
export function CardListExample() {
  const [page, setPage] = useState(0);
  const limit = 10;
  const offset = page * limit;

  // Use the useCards hook to fetch paginated cards
  const {
    data: cards,
    isLoading,
    error,
    refetch
  } = useCards({ limit, offset });

  if (isLoading) return <div>Loading cards...</div>;
  if (error) return <div>Error loading cards: {error.message}</div>;

  return (
    <div>
      <h2>Pokemon Cards (Page {page + 1})</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {cards?.map((card) => (
          <div key={card.id}>
            <h3>{card.name}</h3>
            <p>HP: {card.hp || 'N/A'}</p>
            <p>Rarity: {card.rarity || 'N/A'}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
        <button onClick={() => refetch()}>Refresh</button>
      </div>
    </div>
  );
}

/**
 * Example 2: Fetching cards by set
 */
export function CardsBySetExample() {
  const setId = 'sv4pt'; // Paldean Fates set

  const { data: cards, isLoading, error } = useCardsBySet(setId);

  if (isLoading) return <div>Loading set cards...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Cards from Set: {setId}</h2>
      <p>Found {cards?.length || 0} cards</p>
      <ul>
        {cards?.map((card) => (
          <li key={card.id}>
            {card.name} (#{card.number}) - {card.rarity}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 3: Search cards by name
 */
export function CardSearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search to avoid too many requests
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: cards, isLoading } = useCardsByName(debouncedSearch, {
    enabled: debouncedSearch.length > 2 // Only search with 3+ characters
  });

  return (
    <div>
      <h2>Search Pokemon Cards</h2>
      <input
        type="text"
        placeholder="Search by card name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '0.5rem' }}
      />
      {isLoading && <p>Searching...</p>}
      {cards && cards.length > 0 && (
        <div>
          <p>Found {cards.length} results</p>
          <ul>
            {cards.map((card) => (
              <li key={card.id}>
                {card.name} - {card.hp} HP
              </li>
            ))}
          </ul>
        </div>
      )}
      {cards && cards.length === 0 && debouncedSearch && <p>No cards found</p>}
    </div>
  );
}

/**
 * Example 4: Viewing a single card with detail
 */
export function CardDetailExample({ cardId }: { cardId: string }) {
  const { data: card, isLoading, error } = useCard(cardId);

  if (isLoading) return <div>Loading card details...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!card) return <div>Card not found</div>;

  return (
    <div>
      <h2>{card.name}</h2>
      <div>
        <strong>Type:</strong> {card.supertype}
      </div>
      <div>
        <strong>HP:</strong> {card.hp || 'N/A'}
      </div>
      <div>
        <strong>Rarity:</strong> {card.rarity || 'Unknown'}
      </div>
      <div>
        <strong>Artist:</strong> {card.artist || 'Unknown'}
      </div>
      {card.abilities && (
        <div>
          <strong>Abilities:</strong> {card.abilities}
        </div>
      )}
      {card.attacks && (
        <div>
          <strong>Attacks:</strong> {card.attacks}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Creating a new card with mutation
 */
export function CreateCardExample() {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    supertype: 'Pokémon',
    subtypes: '["Basic"]',
    set_id: '',
    number: '',
    hp: 60,
    types: '["Normal"]',
    rarity: 'Common',
    artist: ''
  });

  const createCard = useCreateCard({
    onSuccess: (newCard) => {
      alert(`Card created successfully: ${newCard.name}`);
      // Reset form
      setFormData({
        id: '',
        name: '',
        supertype: 'Pokémon',
        subtypes: '["Basic"]',
        set_id: '',
        number: '',
        hp: 60,
        types: '["Normal"]',
        rarity: 'Common',
        artist: ''
      });
    },
    onError: (error) => {
      alert(`Error creating card: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCard.mutate(formData);
  };

  return (
    <div>
      <h2>Create New Card</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Card ID:
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </label>
        </div>
        <div>
          <label>
            HP:
            <input
              type="number"
              value={formData.hp}
              onChange={(e) =>
                setFormData({ ...formData, hp: parseInt(e.target.value) })
              }
            />
          </label>
        </div>
        <div>
          <label>
            Set ID:
            <input
              type="text"
              value={formData.set_id}
              onChange={(e) =>
                setFormData({ ...formData, set_id: e.target.value })
              }
              required
            />
          </label>
        </div>
        <div>
          <label>
            Card Number:
            <input
              type="text"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              required
            />
          </label>
        </div>
        <button type="submit" disabled={createCard.isPending}>
          {createCard.isPending ? 'Creating...' : 'Create Card'}
        </button>
      </form>
    </div>
  );
}

/**
 * Example 6: Deleting a card with mutation
 */
export function DeleteCardExample({ cardId }: { cardId: string }) {
  const deleteCard = useDeleteCard({
    onSuccess: () => {
      alert('Card deleted successfully!');
    },
    onError: (error) => {
      alert(`Error deleting card: ${error.message}`);
    }
  });

  return (
    <button
      onClick={() => {
        if (confirm('Are you sure you want to delete this card?')) {
          deleteCard.mutate({ id: cardId });
        }
      }}
      disabled={deleteCard.isPending}
    >
      {deleteCard.isPending ? 'Deleting...' : 'Delete Card'}
    </button>
  );
}

/**
 * Example 7: Complete component with all features
 */
export function ComprehensiveCardManager() {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>(
    'list'
  );

  return (
    <div style={{ padding: '2rem' }}>
      <nav style={{ marginBottom: '1rem' }}>
        <button onClick={() => setViewMode('list')}>Card List</button>
        <button onClick={() => setViewMode('create')}>Create Card</button>
      </nav>

      {viewMode === 'list' && <CardListExample />}

      {viewMode === 'detail' && selectedCardId && (
        <CardDetailExample cardId={selectedCardId} />
      )}

      {viewMode === 'create' && <CreateCardExample />}
    </div>
  );
}
