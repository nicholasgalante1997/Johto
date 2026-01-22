---
name: react-bun-ssr
description: React 19 patterns with Bun runtime, SSR, hydration, and modern React features for Pokemon TCG platform.
tags:
  - react
  - bun
  - ssr
  - typescript
---

# React 19 + Bun SSR Patterns

## Purpose

Define patterns for React 19 server-side rendering with Bun runtime, focusing on SSR hydration, streaming, and Pokemon TCG UI development.

## Priority

**High**

## Core Patterns

### Server-Side Rendering

**ALWAYS** implement SSR for initial page loads (ID: SSR_FIRST)

```typescript
// Server-side rendering entry
import React from 'react';
import { renderToReadableStream, renderToString } from 'react-dom/server';

import { getBrowserJavascriptBundle } from './fs';

import App from '../../../../web/App';
import ServerErrorPage from '../../../../web/pages/ServerErrorPage';

export async function renderWebApp() {
  const bundle = await getBrowserJavascriptBundle();
  if (!bundle) {
    return new Response(
      renderToString(
        <ServerErrorPage error={new Error('Missing Web Assets')} />
      ),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }

  const stream = await renderToReadableStream(<App />, {
    bootstrapScriptContent: `window.__INITIAL_STATE__ = ${JSON.stringify({})}`,
    bootstrapModules: [bundle]
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

**ALWAYS** hydrate on the client (ID: CLIENT_HYDRATE)

```typescript
// Client-side hydration
import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from '../App';

hydrateRoot(document, <App />);

```

### React 19 Features

**ALWAYS** use canary features when beneficial (ID: USE_CANARY)

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "types": ["react/canary", "react-dom/canary"]
  }
}
```

**ALWAYS** use React.use() for async data (ID: USE_HOOK)

```typescript
import { use } from 'react';

function PokemonCard({ cardPromise }: { cardPromise: Promise<Card> }) {
  const card = use(cardPromise);
  return <div>{card.name}</div>;
}
```

### Bun Runtime Patterns

**ALWAYS** use Bun.serve() for SSR server (ID: BUN_SERVE)

```typescript
import { serve } from './server/server';

const server = serve();
console.log(`Server running on http://localhost:${server.port}`);
```

**ALWAYS** use Bun native APIs (ID: BUN_NATIVE)

```typescript
// Use Bun.file for file operations
const data = await Bun.file('./data/cards.json').json();

// Use Bun.write for writing files
await Bun.write('./dist/index.html', html);
```

**NEVER** use Node.js-specific APIs incompatible with Bun (ID: NO_NODE_SPECIFIC)

### Component Patterns

**ALWAYS** use functional components (ID: FUNCTIONAL_ONLY)

**ALWAYS** export with React.memo for optimization (ID: MEMO_EXPORT)

```typescript
import React from 'react';

function PokemonCard({ card }: PokemonCardProps) {
  return (
    <div className="pokemon-card">
      <h3>{card.name}</h3>
      <p>HP: {card.hp}</p>
    </div>
  );
}

export default React.memo(PokemonCard);
```

### File Structure

**ALWAYS** follow this structure (ID: COMPONENT_STRUCTURE)

```
ComponentName/
├── index.ts              # Barrel export
├── Component.tsx         # Logic and Data Layer
├── View.tsx              # View/Markup Layer
├── ComponentName.css     # Component styles
├── types.ts              # TypeScript types
└── __tests__/
    └── ComponentName.test.tsx
```

### Data Fetching

**ALWAYS** fetch data on server when possible (ID: SERVER_FETCH)

```typescript
// Server-side data fetching
export async function getServerSideProps() {
  const cards = await fetch('http://localhost:8080/graphql', {
    method: 'POST',
    body: JSON.stringify({ query: '{ cards { id name } }' })
  }).then((r) => r.json());

  return { props: { cards } };
}
```

**ALWAYS** handle loading states with Suspense (ID: USE_SUSPENSE)

```typescript
import { Suspense } from 'react';

function CardGrid() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PokemonCardList />
    </Suspense>
  );
}
```

### TypeScript Integration

**ALWAYS** define component props interfaces (ID: PROPS_INTERFACE)

```typescript
import { PokemonCard as CardData } from '@pokemon/pokemon-data';

export interface PokemonCardProps {
  card: CardData;
  onSelect?: (card: CardData) => void;
  variant?: 'grid' | 'list' | 'detail';
  className?: string;
}
```

**ALWAYS** type children prop explicitly (ID: TYPE_CHILDREN)

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}
```

### Performance Optimization

**ALWAYS** use React.memo for expensive components (ID: MEMO_EXPENSIVE)

**ALWAYS** use useMemo for expensive computations (ID: USE_MEMO)

```typescript
import { useMemo } from 'react';

function CardGrid({ cards }: { cards: Card[] }) {
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => a.name.localeCompare(b.name));
  }, [cards]);

  return <div>{sortedCards.map(card => <Card key={card.id} card={card} />)}</div>;
}
```

**ALWAYS** use useCallback for event handlers passed to children (ID: USE_CALLBACK)

```typescript
import { useCallback } from 'react';

function CardSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const handleClick = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  return <Card onClick={handleClick} />;
}
```

### SSR Hydration

**ALWAYS** ensure server and client render the same (ID: MATCH_RENDERS)

**NEVER** use browser-only APIs during render (ID: NO_BROWSER_APIS)

```typescript
// Bad
function Component() {
  const width = window.innerWidth; // Error on server!
  return <div>{width}</div>;
}

// Good
function Component() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  return <div>{width || 'Loading...'}</div>;
}
```

### Styling

**ALWAYS** import CSS in component files (ID: IMPORT_CSS)

```typescript
import './PokemonCard.css';

function PokemonCard() {
  return <div className="pokemon-card">...</div>;
}
```

**ALWAYS** use CSS modules or scoped selectors (ID: SCOPED_STYLES)

### Error Boundaries

**ALWAYS** wrap components with error boundaries (ID: ERROR_BOUNDARIES)

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <CardBrowser />
    </ErrorBoundary>
  );
}
```

## Testing Patterns

**ALWAYS** test components with Bun test runner (ID: BUN_TEST)

```typescript
import { expect, test } from 'bun:test';
import { render } from '@testing-library/react';
import PokemonCard from './PokemonCard';

test('renders card name', () => {
  const card = { id: '1', name: 'Pikachu', hp: '60' };
  const { getByText } = render(<PokemonCard card={card} />);
  expect(getByText('Pikachu')).toBeDefined();
});
```

## Build Configuration

**ALWAYS** use bun for bundling for production (ID: BUN_BUILDER)

```javascript
// src/build/browser.ts
await Bun.build({
  entrypoints: ['src/web/browser/index.tsx'],
  jsx: {
    runtime: 'automatic',
    importSource: 'react'
  },
  outdir: './out',
  naming: {
    entry: 'www/browser.[hash].js'
  },
  target: 'browser',
  format: 'esm',
  packages: 'bundle',
  splitting: false,
  sourcemap: 'linked',
  minify: false,
  root: '.'
});
```

## Pokemon TCG Specific

**ALWAYS** handle card image loading gracefully (ID: LAZY_IMAGES)

```typescript
function PokemonCardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = '/placeholder-card.png';
      }}
    />
  );
}
```

**ALWAYS** virtualize large card lists (ID: VIRTUALIZE_LISTS)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function CardGrid({ cards }: { cards: Card[] }) {
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300
  });

  // ... render virtual items
}
```

## Common Mistakes to Avoid

- Using window/document during SSR
- Mismatched server/client renders
- Not memoizing expensive components
- Importing Node.js-only modules in browser code
- Not handling hydration errors
- Using synchronous data fetching in components

## Examples

### Complete SSR Component

```typescript
// CardBrowser.tsx
import React, { Suspense } from 'react';
import './CardBrowser.css';

interface CardBrowserProps {
  initialCards?: Card[];
}

function CardBrowser({ initialCards = [] }: CardBrowserProps) {
  return (
    <div className="card-browser">
      <h1>Pokemon Cards</h1>
      <Suspense fallback={<LoadingGrid />}>
        <CardGrid cards={initialCards} />
      </Suspense>
    </div>
  );
}

export default React.memo(CardBrowser);
```

### SSR Entry Point

```typescript
// apps/web/src/server/server.ts
import { handleRequest } from './lib/handleRequest';
import { middleware } from './lib/middleware/middleware';

export const serve = () => {
  return Bun.serve({
    port: 3000,
    async fetch(req) {
      middleware(req);
      return handleRequest(req);
    }
  });
};
```
