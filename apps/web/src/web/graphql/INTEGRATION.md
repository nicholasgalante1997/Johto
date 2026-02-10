# Integration Guide

## Quick Start

### Step 1: Wrap your app with QueryProvider

The `QueryProvider` should wrap your entire application at the root level. This is typically done in your main app entry point or root component.

**Example: In your Document or App component**

```tsx
import { QueryProvider } from '@/providers';
import Document from '@/components/Document/Document';

function App() {
  return (
    <QueryProvider>
      <Document title="Pokemon TCG">
        <YourRoutes />
      </Document>
    </QueryProvider>
  );
}

export default App;
```

### Step 2: Use GraphQL hooks in any component

Once wrapped with `QueryProvider`, you can use the GraphQL hooks anywhere in your component tree:

```tsx
import { useCards } from '@/lib/graphql';

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

## Server-Side Rendering (SSR) Integration

For SSR with React, you can prefetch data on the server:

```tsx
import {
  QueryClient,
  dehydrate,
  HydrationBoundary
} from '@tanstack/react-query';
import { graphqlClient, GET_ALL_CARDS } from '@/lib/graphql';

export async function loader() {
  const queryClient = new QueryClient();

  // Prefetch data on the server
  await queryClient.prefetchQuery({
    queryKey: ['cards', { limit: 10, offset: 0 }],
    queryFn: async () => {
      const data = await graphqlClient.request(GET_ALL_CARDS, {
        limit: 10,
        offset: 0
      });
      return data.cards;
    }
  });

  return {
    dehydratedState: dehydrate(queryClient)
  };
}

export function Component({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <YourComponent />
    </HydrationBoundary>
  );
}
```

## React Router Integration

If using React Router v7, integrate in your route components:

```tsx
// routes/cards.tsx
import { useCards } from '@/lib/graphql';

export default function CardsRoute() {
  const { data: cards, isLoading } = useCards();

  return (
    <div>
      <h1>Pokemon Cards</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {cards?.map((card) => (
            <div key={card.id}>{card.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Environment Configuration

The GraphQL client automatically detects the endpoint:

- **Browser**: `${window.location.origin}/graphql`
- **Server**: `process.env.GRAPHQL_ENDPOINT` or fallback to `http://localhost:3000/graphql`

To customize, set the environment variable:

```bash
# .env
GRAPHQL_ENDPOINT=http://localhost:3000/graphql
```

Or for production:

```bash
GRAPHQL_ENDPOINT=https://api.your-domain.com/graphql
```

## Common Integration Patterns

### Pattern 1: Layout with Provider

```tsx
// src/web/App.tsx
import { QueryProvider } from '@/providers';
import { Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <QueryProvider>
      <div className="app">
        <Header />
        <Outlet /> {/* Child routes render here */}
        <Footer />
      </div>
    </QueryProvider>
  );
}
```

### Pattern 2: Multiple Providers

If you have other providers (auth, theme, etc.), stack them:

```tsx
import { QueryProvider } from '@/providers';
import { AuthProvider } from '@/auth';
import { ThemeProvider } from '@/theme';

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <YourApp />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
```

### Pattern 3: Component with Loading State

```tsx
import { useCards } from '@/lib/graphql';
import { Suspense } from 'react';

function CardList() {
  const { data: cards, isLoading, error } = useCards();

  if (isLoading) {
    return <div className="spinner">Loading cards...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error loading cards</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {cards?.map((card) => (
        <CardComponent key={card.id} card={card} />
      ))}
    </div>
  );
}
```

## Troubleshooting

### Issue: "No QueryClient set, use QueryClientProvider"

**Solution**: Ensure `QueryProvider` wraps your component tree:

```tsx
import { QueryProvider } from '@/providers';

<QueryProvider>
  <App />
</QueryProvider>;
```

### Issue: Queries not fetching

**Solution**: Check the `enabled` option:

```tsx
// This won't fetch if cardId is undefined
const { data } = useCard(cardId, { enabled: !!cardId });
```

### Issue: Stale data showing

**Solution**: Adjust `staleTime` or call `refetch()`:

```tsx
const { data, refetch } = useCards();

// Manual refetch
<button onClick={() => refetch()}>Refresh</button>;

// Or adjust staleTime
const { data } = useCards(
  {},
  {
    staleTime: 0 // Always consider stale
  }
);
```

### Issue: Too many requests

**Solution**: Increase `staleTime` or use debouncing:

```tsx
const { data } = useCards(
  {},
  {
    staleTime: 1000 * 60 * 5 // 5 minutes
  }
);
```

## Next Steps

1. **Read the main README.md** for hook documentation and examples
2. **Check examples/CardListExample.tsx** for working component examples
3. **Explore the hooks** in `src/web/lib/graphql/hooks/`
4. **Customize the QueryClient** in `src/web/providers/QueryProvider.tsx` if needed

## Additional Resources

- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools) - Add debugging tools
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
