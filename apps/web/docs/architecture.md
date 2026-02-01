# Architecture & data flow

## System topology

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│   GET /bff/card/abc          (page-level fetch during SSR)      │
│   GET /api/v1/cards?page=2   (client-side paginated fetch)      │
│   POST /graphql              (client-side GraphQL query)        │
└───────────────┬─────────────────────┬───────────────────────────┘
                │                     │
                ▼                     ▼
┌───────────────────────────────────────────────────────────────────┐
│  Bun server  ·  port 3000  ·  src/server/server.ts                │
│                                                                   │
│  ┌─────────────────┐   ┌──────────────────────────────────────┐  │
│  │  /bff/* router  │   │  Proxy layer                         │  │
│  │                 │   │                                      │  │
│  │  ┌────────────┐ │   │  /api/v1/* ──► proxyToRestApi()      │  │
│  │  │  handlers  │ │   │  /graphql  ──► proxyToGraphqlApi()   │  │
│  │  └─────┬──────┘ │   └──────────────────┬───────────────────┘  │
│  └────────┼────────┘                      │                      │
│           │                               │                      │
│  ┌────────▼───────────────────────────────▼───────────────────┐  │
│  │  Typed clients                                             │  │
│  │                                                            │  │
│  │  RestApiClient     ·  AbortController timeout              │  │
│  │  GraphQLClient     ·  query string encapsulation           │  │
│  └────────┬───────────────────────────────┬────────────────────┘  │
│           │                               │                      │
│  ┌────────▼───────────────────────────────▼────────────────────┐  │
│  │  Circuit breakers  (one per downstream service)             │  │
│  │                                                            │  │
│  │  restApiCircuit     ·  graphqlApiCircuit                   │  │
│  └────────┬───────────────────────────────┬────────────────────┘  │
└───────────┼───────────────────────────────┼──────────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────┐
│  REST API           │       │  GraphQL API            │
│  (Rust / Actix-web) │       │  (Rust / async-graphql) │
│                     │       │                         │
│  /api/v1/cards      │       │  query { card { ... } } │
│  /api/v1/sets       │       │  query { stats { ... } }│
│  /health            │       │  query { health { ... } }│
└─────────────────────┘       └─────────────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────┐
│  PostgreSQL         │       │  PostgreSQL + Neo4j     │
│  (paginated tables) │       │  (graph traversals)     │
└─────────────────────┘       └─────────────────────────┘
```

## Request flow: aggregation path (`/bff/*`)

This is the path used during **server-side rendering**. The SSR layer needs all the data for a page before it can produce HTML, so it hits a BFF endpoint that fetches and assembles everything in one go.

```
Browser / SSR renderer
        │
        │  GET /bff/card/abc
        ▼
server.ts  ──  isBffRoute() returns true
        │
        ▼
router.ts  ──  pattern match against registered routes
        │      extracts { id: "abc" } from URL
        ▼
handlers/card.ts  ──  getCardDetail()
        │
        ├──► graphqlClient.getCard("abc")        ← primary fetch
        │         └── circuit breaker check
        │         └── POST /graphql  →  Rust API
        │
        ├──► graphqlClient.getCardsByName("Pikachu")  ← secondary fetch
        │         └── circuit breaker check
        │         └── POST /graphql  →  Rust API
        │
        ├──► bffCache.set(...)                   ← cache for next request
        │
        └──► Response { data, warnings? }
                    │
                    ▼
              JSON → SSR renderer → HTML
```

Key properties of this path:

- The handler **owns** the response shape. It strips fields, renames keys, and flattens nested structures to match what the frontend component actually renders.
- Sub-fetches are **individually guarded**. If `getCardsByName` throws, the handler catches it, sets `relatedCards: []`, and adds a warning. The page still renders with the primary card data.
- Results are **cached** at the handler level. Subsequent requests for the same card ID within the TTL skip all downstream calls entirely.

## Request flow: proxy path (`/api/v1/*`, `/graphql`)

This is the path used for **client-side fetching** after the page has hydrated — for example, paginating through browse results without a full page reload.

```
Browser (after hydration)
        │
        │  GET /api/v1/cards?page=2
        ▼
server.ts  ──  pathname.startsWith('/api/v1/')
        │
        ▼
proxy.ts  ──  proxyToRestApi()
        │
        ├──  restApiCircuit.isOpen()?  ──► yes → 503 immediately
        │
        ├──  fetch(restApiUrl + pathname + search)
        │         └── forward method, headers, body
        │
        ├──  response.ok?  ──► recordSuccess()
        │    response >= 500?  ──► recordFailure()
        │
        └──► Response (proxied body, original status, + X-Proxied-By header)
```

The proxy adds no caching and performs no data transformation. It is a thin wrapper whose only job is to (a) rewrite the URL to the internal service address and (b) maintain circuit breaker state.

## Why two paths instead of one?

| Concern | Aggregation path | Proxy path |
|---|---|---|
| **When it runs** | During SSR, before HTML is sent | After hydration, on user interaction |
| **Data shape** | Reshaped per-view | Passed through verbatim |
| **Caching** | Handler-level in-memory cache | None (browser cache headers from upstream apply) |
| **Error handling** | Partial — page can render with missing data | Pass-through — client receives the upstream status |
| **Protocol** | Handler picks REST or GraphQL per need | Client chooses; proxy forwards to matching service |

During SSR the page renderer cannot make multiple round-trips to different origins, so the aggregation path collapses that into a single server-side fan-out. After hydration the client has full control and can fetch incrementally, so the proxy path is sufficient.
