# Adding a new endpoint

This is a step-by-step guide for adding a new BFF aggregation endpoint. If you just need to expose a new upstream API path to the browser without any aggregation, that already works — the proxy forwards any `/api/v1/*` or `/graphql` request automatically. This guide is for when you need a `/bff/*` endpoint that fetches, combines, or reshapes data.

## Step 1 — Decide whether you need a BFF endpoint

You need one if any of these are true:

- The view requires data from **more than one** downstream call.
- You need to **strip or reshape** the upstream response to match what the component renders.
- You want **partial failure tolerance** — the page should render even if one data source is unavailable.
- You want **server-side caching** to avoid redundant fetches for frequently viewed data.

If none of these apply — if the component just needs a single upstream endpoint's response verbatim — the existing proxy path is sufficient. Have the component fetch `/api/v1/...` or `/graphql` directly.

## Step 2 — Add the route

Open `src/server/bff/router.ts` and add a new route to the `routes` array:

```typescript
const routes: BffRoute[] = [
  route('/bff/health',      getBffHealth),
  route('/bff/dashboard',   getDashboard),
  route('/bff/browse',      getBrowse),
  route('/bff/card/:id',    getCardDetail),
  route('/bff/deck/:deckId', getDeckDetail),   // ← new route
];
```

Path parameters (`:deckId`) are automatically extracted by the router and passed to the handler as the `params` object. The route pattern is converted to a regex internally — no additional configuration needed.

Import the handler at the top of the file alongside the existing imports.

## Step 3 — Create the handler

Create a new file in `src/server/bff/handlers/`. Follow the existing naming convention: the file name matches the resource, the exported function is named `get<Resource>`.

```typescript
// src/server/bff/handlers/deck.ts

import { graphqlClient, restApiClient } from '../clients';
import { bffCache } from '../cache';
import type { BffContext, BffResponse } from '../types';

const CACHE_PREFIX = 'bff:deck:';
const CACHE_TTL   = 180000; // 3 minutes

export async function getDeckDetail(
  request:      Request,
  params:       Record<string, string>,
  searchParams: URLSearchParams,
  context:      BffContext
): Promise<Response> {
  const { deckId } = params;

  // Input validation
  if (!deckId) {
    return new Response(
      JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Deck ID is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'X-Request-ID': context.requestId } }
    );
  }

  // Cache check
  const cacheKey = `${CACHE_PREFIX}${deckId}`;
  const cached   = bffCache.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ data: cached }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', 'X-Request-ID': context.requestId }
    });
  }

  const errors: Array<{ source: string; code: string; message: string }> = [];
  const data: Record<string, any> = {};

  // Primary fetch — fatal if it fails
  try {
    const deckResult = await graphqlClient.getDeck(deckId);
    if (!deckResult.deck) {
      return new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: `Deck ${deckId} not found` } }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'X-Request-ID': context.requestId } }
      );
    }
    data.deck = deckResult.deck;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch deck' } }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'X-Request-ID': context.requestId } }
    );
  }

  // Secondary fetch — non-critical
  try {
    const statsResult = await restApiClient.getDeckStats(deckId);
    data.stats = statsResult.data;
  } catch (error) {
    data.stats = null;
    errors.push({ source: 'rest', code: 'STATS_FAILED', message: 'Failed to fetch deck stats' });
  }

  // Cache the assembled response
  bffCache.set(cacheKey, data, CACHE_TTL);

  const response: BffResponse<typeof data> = { data };
  if (errors.length > 0) {
    response.warnings = errors.map((e) => e.message);
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', 'X-Request-ID': context.requestId }
  });
}
```

## Step 4 — Add client methods if needed

If your handler needs to call an upstream endpoint that no existing client method covers, add one to the appropriate client file.

**For REST** (`src/server/bff/clients/RestApiClient.ts`):

```typescript
async getDeckStats(deckId: string) {
  return this.get<{ data: { cardCount: number; typeBreakdown: Record<string, number> } }>(
    `/api/v1/decks/${deckId}/stats`
  );
}
```

**For GraphQL** (`src/server/bff/clients/GraphQLClient.ts`):

```typescript
async getDeck(id: string) {
  return this.query<{ deck: any }>(
    `
    query Deck($id: ID!) {
      deck(id: $id) {
        id
        name
        cards { id name types rarity images { small } }
        createdAt
      }
    }
    `,
    { id }
  );
}
```

Keep the query field selection tight — only request what the handler actually uses in its response.

## Step 5 — Export from the handlers barrel

If the handlers directory uses a barrel export (`index.ts`), add your new handler:

```typescript
export { getDeckDetail } from './deck';
```

## Step 6 — Add types (optional but recommended)

If the response shape is complex, define a TypeScript interface in `src/server/bff/types.ts` alongside the existing types:

```typescript
export interface DeckDetailData {
  deck: {
    id:    string;
    name:  string;
    cards: Array<{ id: string; name: string; types: string[]; rarity: string }>;
  };
  stats: {
    cardCount:     number;
    typeBreakdown: Record<string, number>;
  } | null;   // null when the stats fetch failed
}
```

## Checklist

- [ ] Route added to `router.ts`
- [ ] Handler file created in `handlers/`
- [ ] Handler exported from barrel (if applicable)
- [ ] Client methods added for any new upstream calls
- [ ] Primary fetch failures return 503; secondary fetch failures are collected as warnings
- [ ] Cache key is unique and includes all parameters that affect the response
- [ ] Response includes `X-Request-ID` and `X-Cache` headers
- [ ] TypeScript types defined for the response shape
