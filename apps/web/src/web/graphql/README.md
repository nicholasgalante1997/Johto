# GraphQL Client with React Query

Complete client-side GraphQL implementation integrated with `@tanstack/react-query` for the Pokemon TCG API.

## Overview

This GraphQL client provides:

- **Type-safe queries and mutations** with full TypeScript support
- **Automatic caching and background updates** via react-query
- **Optimistic updates and cache invalidation** for mutations
- **Loading and error states** handled automatically
- **Retry logic and exponential backoff** for failed requests
- **Request deduplication** and efficient network usage

## Setup

### 1. Wrap your app with QueryProvider

```tsx
import { QueryProvider } from '@/providers';
import { App } from './App';

function Root() {
  return (
    <QueryProvider>
      <App />
    </QueryProvider>
  );
}
```

### 2. Import and use hooks in your components

```tsx
import { useCards, useCreateCard } from '@/lib/graphql';

function MyComponent() {
  const { data, isLoading, error } = useCards({ limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((card) => (
        <div key={card.id}>{card.name}</div>
      ))}
    </div>
  );
}
```

## Available Hooks

### Query Hooks

#### User Queries

- `useUsers(variables?, options?)` - Fetch all users
- `useUser(userId, options?)` - Fetch single user by ID

#### Set Queries

- `useSets(variables?, options?)` - Fetch all sets
- `useSet(setId, options?)` - Fetch single set by ID
- `useSetsBySeries(series, options?)` - Fetch sets by series name

#### Card Queries

- `useCards(variables?, options?)` - Fetch all cards with pagination
- `useCard(cardId, options?)` - Fetch single card by ID
- `useCardsBySet(setId, options?)` - Fetch cards from specific set
- `useCardsByName(name, options?)` - Search cards by name

### Mutation Hooks

#### User Mutations

- `useCreateUser(options?)` - Create new user
- `useUpdateUser(options?)` - Update existing user
- `useDeleteUser(options?)` - Delete user

#### Set Mutations

- `useCreateSet(options?)` - Create new set

#### Card Mutations

- `useCreateCard(options?)` - Create new card
- `useDeleteCard(options?)` - Delete card

## Usage Examples

### Basic Query

```tsx
import { useCards } from '@/lib/graphql';

function CardList() {
  const {
    data: cards,
    isLoading,
    error
  } = useCards({
    limit: 10,
    offset: 0
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {cards?.map((card) => (
        <li key={card.id}>{card.name}</li>
      ))}
    </ul>
  );
}
```

### Query with Options

```tsx
import { useCard } from '@/lib/graphql';

function CardDetail({ cardId }: { cardId: string }) {
  const { data: card, isLoading } = useCard(cardId, {
    // Only fetch if cardId is provided
    enabled: !!cardId,
    // Keep data fresh for 10 minutes
    staleTime: 1000 * 60 * 10,
    // Callback when query succeeds
    onSuccess: (data) => {
      console.log('Card loaded:', data.name);
    }
  });

  return <div>{card?.name}</div>;
}
```

### Conditional/Debounced Query

```tsx
import { useState, useEffect } from 'react';
import { useCardsByName } from '@/lib/graphql';

function CardSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: cards, isLoading } = useCardsByName(debouncedSearch, {
    // Only search with 3+ characters
    enabled: debouncedSearch.length > 2
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search cards..."
      />
      {isLoading && <span>Searching...</span>}
      {cards?.map((card) => (
        <div key={card.id}>{card.name}</div>
      ))}
    </div>
  );
}
```

### Simple Mutation

```tsx
import { useCreateCard } from '@/lib/graphql';

function CreateCard() {
  const createCard = useCreateCard();

  const handleSubmit = () => {
    createCard.mutate({
      id: 'custom-pikachu-1',
      name: 'Custom Pikachu',
      supertype: 'Pokémon',
      subtypes: '["Basic"]',
      set_id: 'sv4pt',
      number: '999',
      hp: 60,
      types: '["Electric"]',
      rarity: 'Common'
    });
  };

  return (
    <button onClick={handleSubmit} disabled={createCard.isPending}>
      {createCard.isPending ? 'Creating...' : 'Create Card'}
    </button>
  );
}
```

### Mutation with Callbacks

```tsx
import { useCreateCard } from '@/lib/graphql';
import { useState } from 'react';

function CreateCardForm() {
  const [formData, setFormData] = useState({ name: '', hp: 60 });

  const createCard = useCreateCard({
    onSuccess: (newCard) => {
      alert(`Card "${newCard.name}" created successfully!`);
      setFormData({ name: '', hp: 60 }); // Reset form
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createCard.mutate({
          id: `custom-${Date.now()}`,
          name: formData.name,
          hp: formData.hp
          // ... other required fields
        });
      }}
    >
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <button type="submit" disabled={createCard.isPending}>
        Create
      </button>
    </form>
  );
}
```

### Pagination

```tsx
import { useState } from 'react';
import { useCards } from '@/lib/graphql';

function PaginatedCards() {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: cards, isLoading } = useCards({
    limit,
    offset: page * limit
  });

  return (
    <div>
      {cards?.map((card) => (
        <div key={card.id}>{card.name}</div>
      ))}
      <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
        Previous
      </button>
      <button onClick={() => setPage((p) => p + 1)}>Next</button>
    </div>
  );
}
```

### Dependent Queries

```tsx
import { useSet, useCardsBySet } from '@/lib/graphql';

function SetWithCards({ setId }: { setId: string }) {
  // First query: get the set details
  const { data: set } = useSet(setId);

  // Second query: get cards from that set
  // This will automatically wait for the setId to be available
  const { data: cards } = useCardsBySet(setId, {
    enabled: !!setId // Only run if setId exists
  });

  return (
    <div>
      <h2>{set?.name}</h2>
      <p>{cards?.length || 0} cards</p>
      {cards?.map((card) => (
        <div key={card.id}>{card.name}</div>
      ))}
    </div>
  );
}
```

### Manual Refetch

```tsx
import { useCards } from '@/lib/graphql';

function CardsWithRefresh() {
  const { data: cards, refetch, isFetching } = useCards();

  return (
    <div>
      {cards?.map((card) => (
        <div key={card.id}>{card.name}</div>
      ))}
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
```

### Optimistic Updates

```tsx
import { useDeleteCard } from '@/lib/graphql';
import { queryClient } from '@/providers';
import type { Card } from '@/lib/graphql';

function DeleteCardButton({ cardId }: { cardId: string }) {
  const deleteCard = useDeleteCard({
    // Optimistically update the UI before server responds
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['cards'] });

      // Get current data
      const previousCards = queryClient.getQueryData<Card[]>(['cards']);

      // Optimistically remove the card
      if (previousCards) {
        queryClient.setQueryData<Card[]>(
          ['cards'],
          previousCards.filter((c) => c.id !== variables.id)
        );
      }

      // Return context with previous data
      return { previousCards };
    },
    // On error, rollback to previous data
    onError: (err, variables, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(['cards'], context.previousCards);
      }
    }
  });

  return (
    <button onClick={() => deleteCard.mutate({ id: cardId })}>Delete</button>
  );
}
```

## React Query Options

All hooks accept react-query options:

```tsx
{
  // Query options
  enabled: boolean;              // Enable/disable query
  staleTime: number;             // Time before data is considered stale
  gcTime: number;                // Garbage collection time
  refetchOnWindowFocus: boolean; // Refetch on window focus
  refetchOnMount: boolean;       // Refetch on component mount
  refetchOnReconnect: boolean;   // Refetch on network reconnect
  retry: number;                 // Number of retries
  retryDelay: number;            // Delay between retries

  // Callbacks
  onSuccess: (data) => void;
  onError: (error) => void;
  onSettled: (data, error) => void;
}
```

## Advanced Usage

### Direct Client Usage

For non-component code or server-side operations:

```tsx
import { graphqlClient } from '@/lib/graphql';
import { GET_CARD_BY_ID } from '@/lib/graphql';

async function fetchCard(cardId: string) {
  const data = await graphqlClient.request(GET_CARD_BY_ID, { cardId });
  return data.card;
}
```

### Custom Hook

Create your own custom hooks combining multiple queries:

```tsx
import { useSet, useCardsBySet } from '@/lib/graphql';

export function useSetWithCards(setId: string) {
  const setQuery = useSet(setId);
  const cardsQuery = useCardsBySet(setId, {
    enabled: !!setId
  });

  return {
    set: setQuery.data,
    cards: cardsQuery.data,
    isLoading: setQuery.isLoading || cardsQuery.isLoading,
    error: setQuery.error || cardsQuery.error
  };
}
```

### Authentication

Set auth tokens for authenticated requests:

```tsx
import { setAuthToken } from '@/lib/graphql';

// Set token (e.g., after login)
setAuthToken('your-jwt-token');

// Clear token (e.g., after logout)
setAuthToken(null);
```

## File Structure

```
src/web/lib/graphql/
├── client.ts          # GraphQL client configuration
├── types.ts           # TypeScript type definitions
├── documents.ts       # GraphQL query/mutation documents
├── hooks/
│   ├── queries.ts     # React Query query hooks
│   ├── mutations.ts   # React Query mutation hooks
│   └── index.ts       # Hooks barrel export
├── examples/          # Usage examples
│   └── CardListExample.tsx
├── index.ts           # Main barrel export
└── README.md          # This file

src/web/providers/
├── QueryProvider.tsx  # React Query provider
└── index.ts           # Providers barrel export
```

## GraphQL Endpoint

The client automatically determines the endpoint:

- **Client-side**: Uses `window.location.origin/graphql`
- **Server-side**: Uses `process.env.GRAPHQL_ENDPOINT` or `http://localhost:3000/graphql`

## Best Practices

1. **Use the QueryProvider** at the root of your app
2. **Enable queries conditionally** when dependent on user input or other data
3. **Debounce search queries** to avoid excessive requests
4. **Use optimistic updates** for better UX in mutations
5. **Handle loading and error states** in your components
6. **Leverage automatic cache invalidation** in mutations
7. **Use TypeScript types** for type safety

## More Examples

See `examples/CardListExample.tsx` for comprehensive examples of all features.

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [graphql-request Documentation](https://github.com/jasonkuhrt/graphql-request)
- [GraphQL Documentation](https://graphql.org/)
