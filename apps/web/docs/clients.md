# Typed clients

The typed clients (`src/server/bff/clients/`) are the HTTP layer between the BFF handlers and the downstream microservices. They encapsulate URL construction, timeout management, response parsing, and error normalization so that handlers can call high-level methods without dealing with raw `fetch` mechanics.

## RestApiClient

**File:** `src/server/bff/clients/RestApiClient.ts`

A generic GET client for the REST microservice. All methods ultimately call a single private `get<T>()` method that handles the shared concerns:

### Timeout via AbortController

Every request creates an `AbortController` and sets a timeout. If the upstream does not respond within `bffConfig.timeout` (default 10 seconds), the fetch is aborted and an explicit timeout error is thrown:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  clearTimeout(timeoutId);
  if (error instanceof Error && error.name === 'AbortError') {
    throw new Error(`REST API timeout after ${this.timeout}ms`);
  }
  throw error;
}
```

This prevents a single slow upstream from holding a Bun worker indefinitely. The timeout is cleared on both success and error paths to avoid leaking timers.

### Methods

| Method                     | Upstream endpoint            | Used by                                                        |
| -------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `getCards(page, pageSize)` | `GET /api/v1/cards`          | `getBrowse` (no filters)                                       |
| `searchCards(params)`      | `GET /api/v1/cards/search`   | `getBrowse` (with filters)                                     |
| `getSets(page, pageSize)`  | `GET /api/v1/sets`           | `getBrowse` (filter options)                                   |
| `getCard(id)`              | `GET /api/v1/cards/:id`      | — (available but not currently used; card detail uses GraphQL) |
| `getSet(id)`               | `GET /api/v1/sets/:id`       | —                                                              |
| `getSetCards(setId, ...)`  | `GET /api/v1/sets/:id/cards` | —                                                              |
| `healthCheck()`            | `GET /health`                | `getBffHealth`                                                 |

### Query parameter handling

The `get<T>()` method accepts an optional `params` object and serializes it onto the URL:

```typescript
if (params) {
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
}
```

`undefined` and `null` values are skipped, so callers can pass optional filter fields without conditional logic:

```typescript
restApiClient.searchCards({
  name: searchParams.get('name') || undefined, // omitted if not present
  type: searchParams.get('type') || undefined,
  page: 1,
  pageSize: 60
});
```

## GraphQLClient

**File:** `src/server/bff/clients/GraphQLClient.ts`

A typed GraphQL client that sends POST requests to the Rust API's `/graphql` endpoint. All queries are defined as methods with inline query strings, so the client doubles as a **query registry** — every GraphQL query the BFF makes is visible in one file.

### Query execution

The core `query<T>()` method handles the full lifecycle:

1. POST a `{ query, variables }` JSON body to the GraphQL endpoint.
2. Apply the same `AbortController` timeout pattern as the REST client.
3. Check `response.ok` — throw on HTTP errors.
4. Parse the JSON response body.
5. If `result.errors` is non-empty, throw with the first error's message. GraphQL returns HTTP 200 even when the query partially fails; this step surfaces those errors.
6. Return `result.data` cast to `T`.

```typescript
const result = await response.json();

if (result.errors && result.errors.length > 0) {
  throw new Error(result.errors[0].message);
}

return result.data as T;
```

> GraphQL errors are logged at the `console.error` level before throwing, so partial failures are visible in server logs even if the handler catches and swallows the exception.

### Methods

| Method                 | Query name    | Used by                         |
| ---------------------- | ------------- | ------------------------------- |
| `getCard(id)`          | `Card`        | `getCardDetail` (primary fetch) |
| `getCardsByName(name)` | `CardsByName` | `getCardDetail` (related cards) |
| `getStats()`           | `Stats`       | — (available for dashboard)     |
| `getRecentSets(limit)` | `RecentSets`  | — (available for dashboard)     |
| `healthCheck()`        | `Health`      | `getBffHealth`                  |

### Field selection per method

Each method requests only the fields it needs. Compare `getCard()` (full detail view) versus `getCardsByName()` (summary for the related cards strip):

**`getCard`** — requests the full card schema:

```graphql
card(id: $id) {
  id name supertype subtypes hp types
  evolvesFrom evolvesTo rules
  abilities { name text type }
  attacks { name cost convertedEnergyCost damage text }
  weaknesses { type value }
  resistances { type value }
  retreatCost convertedRetreatCost
  number artist rarity flavorText
  nationalPokedexNumbers
  legalities { unlimited standard expanded }
  images { small large }
  tcgplayerUrl cardmarketUrl
  set { id name series total releaseDate images { symbol logo } }
}
```

**`getCardsByName`** — requests only what the related-cards strip renders:

```graphql
cardsByName(name: $name) {
  id name supertype types rarity
  images { small large }
  set { id name }
}
```

This is one of the main reasons GraphQL is used for the detail path. A single query fetches the card, its set, and its related cards with exactly the right fields at each level — no over-fetching, no under-fetching.

## Singleton instances

Both clients are instantiated as module-level singletons:

```typescript
export const restApiClient = new RestApiClient();
export const graphqlClient = new GraphQLClient();
```

Handlers import these directly. There is no dependency injection or factory — the base URLs come from `bffConfig` which reads environment variables at startup. If you need to point a client at a different URL (e.g., in tests), construct a new instance with explicit constructor arguments.
