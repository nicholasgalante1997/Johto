# Pokemon TCG Backend for Frontend (BFF) Migration Specification

## Overview

This specification outlines the migration of the monolithic `apps/web` server to a Backend for Frontend (BFF) architecture with dedicated microservices. The current architecture tightly couples the React SSR frontend with REST and GraphQL APIs in a single process. This migration separates concerns into three distinct services:

1. **REST API Microservice** (`apps/rest-api`) - Dedicated Pokemon TCG REST API
2. **GraphQL API Microservice** (`apps/graphql-api`) - Dedicated GraphQL API with schema-first design
3. **Web BFF** (`apps/web`) - React SSR frontend with BFF proxy layer

**Current State:** Single Bun server handling SSR, REST API, and GraphQL at port 3000
**Target State:** Three independent services with the BFF coordinating API access

---

## Problem Statement

### Current Architecture Limitations

1. **Tight Coupling**: Frontend rendering and API logic share a single process, making independent scaling impossible
2. **Deployment Risk**: Any API change requires full frontend redeployment
3. **Resource Contention**: CPU-intensive SSR competes with API request handling
4. **Team Bottlenecks**: Frontend and API changes require coordination in the same codebase
5. **Testing Complexity**: Cannot test APIs in isolation from frontend
6. **No API Specialization**: REST and GraphQL share infrastructure without optimization for either

### BFF Pattern Benefits

1. **Frontend Autonomy**: Web team owns the BFF, iterates without API team coordination
2. **Optimized Payloads**: BFF aggregates and shapes data specifically for React components
3. **Independent Scaling**: Scale APIs and frontend separately based on load patterns
4. **Failure Isolation**: API failures don't crash the frontend server
5. **Protocol Translation**: BFF can combine REST and GraphQL calls into single responses
6. **Caching Strategy**: BFF implements frontend-specific caching (component-level, page-level)

---

## Architecture

### High-Level Design

```
                                    ┌─────────────────────────────┐
                                    │     External Clients        │
                                    │   (Mobile, Third-party)     │
                                    └──────────────┬──────────────┘
                                                   │
                                                   ▼
┌──────────────┐              ┌─────────────────────────────────────────────┐
│              │              │                                             │
│   Browser    │◄────────────►│              Load Balancer                  │
│              │              │                                             │
└──────────────┘              └──────────┬──────────────┬──────────────────┘
                                         │              │
                         ┌───────────────┘              └───────────────┐
                         │                                              │
                         ▼                                              ▼
              ┌─────────────────────┐                      ┌─────────────────────┐
              │                     │                      │                     │
              │   Web BFF (3000)    │                      │   REST API (3001)   │
              │                     │                      │                     │
              │  • React SSR        │                      │  • /api/v1/cards    │
              │  • Static assets    │                      │  • /api/v1/sets     │
              │  • /bff/* proxy     │                      │  • /api/v1/users    │
              │  • Aggregation      │                      │  • /api/v1/decks    │
              │  • Caching          │                      │                     │
              └──────────┬──────────┘                      └──────────┬──────────┘
                         │                                            │
                         │         ┌─────────────────────┐            │
                         │         │                     │            │
                         └────────►│ GraphQL API (3002)  │◄───────────┘
                                   │                     │
                                   │  • /graphql         │
                                   │  • /graphiql        │
                                   │  • Subscriptions    │
                                   │                     │
                                   └──────────┬──────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
              ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
              │                 │  │                 │  │                 │
              │    SQLite       │  │   PostgreSQL    │  │     Neo4j       │
              │  (read-only)    │  │   (primary)     │  │   (graph)       │
              │                 │  │                 │  │                 │
              └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Service Responsibilities

#### Web BFF (`apps/web`) - Port 3000

The BFF is tightly coupled to the React frontend and owned by the frontend team.

**Responsibilities:**

- Server-side rendering of React application
- Static asset serving (JS, CSS, images)
- BFF proxy endpoints (`/bff/*`) for frontend data needs
- Response aggregation from multiple APIs
- Frontend-specific caching
- Authentication session management
- Error transformation for UI consumption

**Does NOT handle:**

- Direct database access
- Business logic beyond UI concerns
- Raw API exposure to external clients

#### REST API Microservice (`apps/rest-api`) - Port 3001

Dedicated RESTful API service for Pokemon TCG data.

**Responsibilities:**

- CRUD operations for cards, sets, users, decks, collections
- Pagination, filtering, sorting
- Resource-oriented endpoints
- API versioning (`/api/v1/`, `/api/v2/`)
- Rate limiting and throttling
- OpenAPI/Swagger documentation
- Direct database access (SQLite read, PostgreSQL write)

#### GraphQL API Microservice (`apps/graphql-api`) - Port 3002

Dedicated GraphQL service optimized for complex queries.

**Responsibilities:**

- GraphQL query and mutation handling
- Schema management and introspection
- DataLoader for N+1 prevention
- Subscription support (future: real-time deck updates)
- Query complexity analysis
- Persisted queries support
- GraphiQL IDE hosting

---

## Directory Structure

### REST API Microservice

```
apps/rest-api/
├── src/
│   ├── index.ts                    # Service entry point
│   ├── server.ts                   # Bun.serve configuration
│   ├── config/
│   │   ├── index.ts                # Config loader
│   │   ├── database.ts             # Database configuration
│   │   └── types.ts                # Config types
│   ├── routes/
│   │   ├── index.ts                # Route registry
│   │   ├── router.ts               # Request routing engine
│   │   ├── cards.ts                # Card routes
│   │   ├── sets.ts                 # Set routes
│   │   ├── users.ts                # User routes (future)
│   │   ├── decks.ts                # Deck routes (future)
│   │   └── health.ts               # Health check routes
│   ├── handlers/
│   │   ├── cards/
│   │   │   ├── index.ts            # Handler exports
│   │   │   ├── getCards.ts         # GET /api/v1/cards
│   │   │   ├── getCardById.ts      # GET /api/v1/cards/:id
│   │   │   └── searchCards.ts      # GET /api/v1/cards/search
│   │   ├── sets/
│   │   │   ├── index.ts            # Handler exports
│   │   │   ├── getSets.ts          # GET /api/v1/sets
│   │   │   ├── getSetById.ts       # GET /api/v1/sets/:id
│   │   │   └── getSetCards.ts      # GET /api/v1/sets/:id/cards
│   │   └── health/
│   │       └── healthCheck.ts      # GET /health, GET /ready
│   ├── middleware/
│   │   ├── index.ts                # Middleware chain
│   │   ├── cors.ts                 # CORS handling
│   │   ├── logging.ts              # Request logging
│   │   ├── rateLimit.ts            # Rate limiting
│   │   ├── validation.ts           # Request validation
│   │   └── errorHandler.ts         # Global error handling
│   ├── services/
│   │   ├── CardService.ts          # Card business logic
│   │   ├── SetService.ts           # Set business logic
│   │   └── CacheService.ts         # Caching layer
│   ├── repositories/
│   │   ├── CardRepository.ts       # Card data access
│   │   └── SetRepository.ts        # Set data access
│   ├── utils/
│   │   ├── response.ts             # Response builders
│   │   ├── pagination.ts           # Pagination utilities
│   │   ├── transforms.ts           # Data transformations
│   │   └── errors.ts               # Custom error types
│   └── types/
│       ├── index.ts                # Type exports
│       ├── api.ts                  # API request/response types
│       ├── cards.ts                # Card domain types
│       └── sets.ts                 # Set domain types
├── package.json
├── tsconfig.json
├── Dockerfile
└── openapi.yaml                    # OpenAPI specification
```

### GraphQL API Microservice

```
apps/graphql-api/
├── src/
│   ├── index.ts                    # Service entry point
│   ├── server.ts                   # Apollo Server setup
│   ├── config/
│   │   ├── index.ts                # Config loader
│   │   └── apollo.ts               # Apollo configuration
│   ├── schema/
│   │   ├── index.ts                # Schema exports
│   │   ├── typeDefs/
│   │   │   ├── index.ts            # Type definition aggregator
│   │   │   ├── card.graphql        # Card type definitions
│   │   │   ├── set.graphql         # Set type definitions
│   │   │   ├── user.graphql        # User type definitions
│   │   │   ├── deck.graphql        # Deck type definitions
│   │   │   └── query.graphql       # Root query definitions
│   │   └── resolvers/
│   │       ├── index.ts            # Resolver aggregator
│   │       ├── cardResolvers.ts    # Card query resolvers
│   │       ├── setResolvers.ts     # Set query resolvers
│   │       ├── userResolvers.ts    # User query resolvers
│   │       └── deckResolvers.ts    # Deck query resolvers
│   ├── dataloaders/
│   │   ├── index.ts                # DataLoader factory
│   │   ├── cardLoader.ts           # Card batch loading
│   │   └── setLoader.ts            # Set batch loading
│   ├── context/
│   │   ├── index.ts                # Context builder
│   │   └── types.ts                # Context types
│   ├── middleware/
│   │   ├── complexity.ts           # Query complexity analysis
│   │   ├── auth.ts                 # Authentication plugin
│   │   └── logging.ts              # Query logging
│   ├── services/
│   │   ├── CardService.ts          # Card operations
│   │   └── SetService.ts           # Set operations
│   ├── utils/
│   │   ├── formatters.ts           # Response formatters
│   │   └── errors.ts               # GraphQL error types
│   └── types/
│       └── generated.ts            # Generated TypeScript types
├── package.json
├── tsconfig.json
├── Dockerfile
├── codegen.yml                     # GraphQL codegen config
└── schema.graphql                  # Combined schema (generated)
```

### Web BFF (Modified `apps/web`)

```
apps/web/
├── src/
│   ├── index.tsx                   # Application entry
│   ├── server/
│   │   ├── server.ts               # Bun.serve with BFF routes
│   │   ├── lib/
│   │   │   ├── handleRequest.ts    # Request dispatcher
│   │   │   ├── routes.ts           # Web route definitions
│   │   │   ├── mime.ts             # MIME utilities
│   │   │   └── renderStaticFile.ts # Static file serving
│   │   ├── bff/                    # NEW: BFF layer
│   │   │   ├── index.ts            # BFF exports
│   │   │   ├── router.ts           # BFF route matching
│   │   │   ├── proxy.ts            # Service proxy utilities
│   │   │   ├── aggregator.ts       # Response aggregation
│   │   │   ├── cache.ts            # BFF caching layer
│   │   │   ├── handlers/
│   │   │   │   ├── dashboard.ts    # GET /bff/dashboard
│   │   │   │   ├── collection.ts   # GET /bff/collection
│   │   │   │   ├── browse.ts       # GET /bff/browse
│   │   │   │   ├── card.ts         # GET /bff/card/:id
│   │   │   │   └── deck.ts         # GET /bff/deck/:id
│   │   │   ├── clients/
│   │   │   │   ├── RestApiClient.ts    # REST API client
│   │   │   │   └── GraphQLClient.ts    # GraphQL API client
│   │   │   └── types.ts            # BFF types
│   │   ├── middleware/
│   │   │   └── middleware.ts       # Request middleware
│   │   └── web/
│   │       ├── index.ts            # Web module exports
│   │       └── utils/
│   │           ├── render.tsx      # React SSR
│   │           └── fs.ts           # File utilities
│   ├── web/                        # React application (unchanged)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── graphql/
│   └── shared/                     # Shared utilities
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## API Specifications

### REST API Endpoints

#### Cards Resource

| Method | Path                   | Description    | Query Parameters                 |
| ------ | ---------------------- | -------------- | -------------------------------- |
| GET    | `/api/v1/cards`        | List all cards | `page`, `limit`, `sort`, `order` |
| GET    | `/api/v1/cards/:id`    | Get card by ID | -                                |
| GET    | `/api/v1/cards/search` | Search cards   | `name`, `type`, `rarity`, `set`  |

#### Sets Resource

| Method | Path                          | Description        | Query Parameters                 |
| ------ | ----------------------------- | ------------------ | -------------------------------- |
| GET    | `/api/v1/sets`                | List all sets      | `page`, `limit`, `sort`, `order` |
| GET    | `/api/v1/sets/:id`            | Get set by ID      | -                                |
| GET    | `/api/v1/sets/:id/cards`      | Get cards in set   | `page`, `limit`                  |
| GET    | `/api/v1/sets/series/:series` | Get sets by series | -                                |

#### Health Endpoints

| Method | Path                | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/health`           | Service health check |
| GET    | `/ready`            | Readiness probe      |
| GET    | `/api/v1/endpoints` | API discovery        |

**Response Envelope:**

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    count: number;
    totalCount: number;
    totalPages: number;
  };
  links?: {
    self: string;
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
}

interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
}
```

### GraphQL Schema

```graphql
# schema/typeDefs/card.graphql
type Card {
  id: ID!
  name: String!
  supertype: String!
  subtypes: [String!]
  hp: Int
  types: [String!]
  evolvesFrom: String
  evolvesTo: [String!]
  rules: [String!]
  abilities: [Ability!]
  attacks: [Attack!]
  weaknesses: [Weakness!]
  resistances: [Resistance!]
  retreatCost: [String!]
  convertedRetreatCost: Int
  set: Set!
  number: String!
  artist: String
  rarity: String
  flavorText: String
  nationalPokedexNumbers: [Int!]
  legalities: Legalities
  images: CardImages!
  tcgplayerUrl: String
  cardmarketUrl: String
}

type Ability {
  name: String!
  text: String!
  type: String!
}

type Attack {
  name: String!
  cost: [String!]!
  convertedEnergyCost: Int!
  damage: String
  text: String
}

type Weakness {
  type: String!
  value: String!
}

type Resistance {
  type: String!
  value: String!
}

type CardImages {
  small: String!
  large: String!
}

type Legalities {
  unlimited: String
  standard: String
  expanded: String
}

# schema/typeDefs/set.graphql
type Set {
  id: ID!
  name: String!
  series: String!
  printedTotal: Int!
  total: Int!
  legalities: Legalities
  ptcgoCode: String
  releaseDate: String!
  updatedAt: String!
  images: SetImages!
  cards(limit: Int, offset: Int): [Card!]!
  cardCount: Int!
}

type SetImages {
  symbol: String!
  logo: String!
}

# schema/typeDefs/query.graphql
type Query {
  # Card queries
  card(id: ID!): Card
  cards(
    limit: Int = 60
    offset: Int = 0
    name: String
    types: [String!]
    rarity: String
    setId: String
  ): CardConnection!
  cardsBySet(setId: ID!, limit: Int, offset: Int): [Card!]!
  cardsByName(name: String!): [Card!]!

  # Set queries
  set(id: ID!): Set
  sets(limit: Int = 50, offset: Int = 0): SetConnection!
  setsBySeries(series: String!): [Set!]!

  # Search
  search(query: String!, type: SearchType!): SearchResult!
}

type CardConnection {
  edges: [CardEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CardEdge {
  node: Card!
  cursor: String!
}

type SetConnection {
  edges: [SetEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type SetEdge {
  node: Set!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

enum SearchType {
  CARD
  SET
  ALL
}

union SearchResult = Card | Set
```

### BFF Endpoints

The BFF provides aggregated, frontend-optimized endpoints:

| Method | Path                  | Description              | Aggregates From                     |
| ------ | --------------------- | ------------------------ | ----------------------------------- |
| GET    | `/bff/dashboard`      | Dashboard page data      | REST: sets (recent), GraphQL: stats |
| GET    | `/bff/browse`         | Browse page with filters | REST: cards with pagination         |
| GET    | `/bff/browse/:cardId` | Card detail modal data   | GraphQL: card with set              |
| GET    | `/bff/collection`     | User collection data     | REST: user cards, GraphQL: sets     |
| GET    | `/bff/deck/:id`       | Deck builder data        | GraphQL: deck with cards            |
| GET    | `/bff/search`         | Unified search           | GraphQL: search query               |

**BFF Response Shape:**

```typescript
// GET /bff/dashboard
interface DashboardData {
  recentSets: SetSummary[];
  featuredCards: CardSummary[];
  stats: {
    totalCards: number;
    totalSets: number;
    lastUpdated: string;
  };
  userStats?: {
    collectionSize: number;
    deckCount: number;
  };
}

// GET /bff/browse
interface BrowseData {
  cards: CardSummary[];
  filters: {
    types: string[];
    rarities: string[];
    sets: SetSummary[];
  };
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// GET /bff/browse/:cardId
interface CardDetailData {
  card: CardFull;
  set: SetSummary;
  relatedCards: CardSummary[]; // Same evolution line
  pricing?: {
    tcgplayer?: number;
    cardmarket?: number;
  };
}
```

---

## Implementation Phases

### Phase 1: REST API Microservice Extraction

**Goal:** Extract REST API handlers into a standalone service.

**Duration Target:** Foundation for independent API deployment

**Tasks:**

1. **Initialize REST API Project**
   - Create `apps/rest-api/` directory structure
   - Configure `package.json` with dependencies
   - Set up `tsconfig.json` extending `@pokemon/configs`
   - Create health check endpoints

2. **Migrate Handlers**
   - Copy `handlers/cards.ts` → `apps/rest-api/src/handlers/cards/`
   - Copy `handlers/sets.ts` → `apps/rest-api/src/handlers/sets/`
   - Copy `handlers/discovery.ts` → `apps/rest-api/src/handlers/health/`
   - Update imports to use local modules

3. **Implement Router**
   - Create pattern-based router (`routes/router.ts`)
   - Support path parameters (`:id`)
   - Support query parameter parsing
   - Implement method matching

4. **Add Middleware Stack**
   - CORS middleware (configurable origins)
   - Request logging with correlation IDs
   - Error handling middleware
   - Request validation (query params, path params)

5. **Configure Database Access**
   - Import `@pokemon/database` SQLite module
   - Create connection pool/singleton
   - Add connection health checks

6. **Create Service Layer**
   - `CardService` for card business logic
   - `SetService` for set business logic
   - Repository pattern for data access

**Deliverables:**

- Standalone REST API running on port 3001
- All existing `/api/v1/*` endpoints functional
- Health check endpoints (`/health`, `/ready`)
- Request logging with correlation IDs

**Acceptance Criteria:**

- All existing REST API tests pass
- Service starts independently
- Responds to health checks
- Handles 1000 req/sec without degradation

---

### Phase 2: GraphQL API Microservice Extraction

**Goal:** Extract GraphQL server into a dedicated service.

**Duration Target:** Optimized GraphQL service with DataLoaders

**Tasks:**

1. **Initialize GraphQL API Project**
   - Create `apps/graphql-api/` directory structure
   - Configure Apollo Server 5.x
   - Set up GraphQL code generation

2. **Migrate Schema**
   - Convert `schema.ts` string schema to `.graphql` files
   - Organize by domain (card.graphql, set.graphql, etc.)
   - Add input types for future mutations

3. **Migrate Resolvers**
   - Copy and refactor resolvers from `graphql/resolvers.ts`
   - Implement proper error handling
   - Add field-level resolvers for nested types

4. **Implement DataLoaders**
   - `CardLoader` for batching card fetches
   - `SetLoader` for batching set fetches
   - Context-scoped DataLoader instances

5. **Add Query Complexity Analysis**
   - Implement complexity calculation
   - Set maximum complexity limit
   - Return complexity in response extensions

6. **Configure GraphiQL**
   - Enable GraphiQL IDE at `/graphiql`
   - Add example queries
   - Configure headers for auth testing

**Deliverables:**

- Standalone GraphQL API on port 3002
- All existing queries functional
- GraphiQL IDE accessible
- DataLoader preventing N+1 queries

**Acceptance Criteria:**

- All existing GraphQL queries return identical data
- N+1 queries eliminated (verified via logging)
- Query complexity limits enforced
- Schema introspection available

---

### Phase 3: BFF Layer Implementation

**Goal:** Implement BFF proxy layer in the web application.

**Duration Target:** Frontend-optimized data aggregation

**Tasks:**

1. **Create BFF Infrastructure**
   - Create `src/server/bff/` directory
   - Implement BFF router for `/bff/*` routes
   - Create service client factories

2. **Implement API Clients**
   - `RestApiClient` - HTTP client for REST API
   - `GraphQLClient` - GraphQL client with caching
   - Connection pooling and timeouts
   - Retry logic with exponential backoff

3. **Implement BFF Handlers**
   - `/bff/dashboard` - Aggregate dashboard data
   - `/bff/browse` - Cards with filter metadata
   - `/bff/browse/:cardId` - Card detail with related data
   - `/bff/collection` - User collection view
   - `/bff/search` - Unified search

4. **Add Response Aggregation**
   - Parallel API calls for independent data
   - Sequential calls for dependent data
   - Response transformation and shaping
   - Error handling with partial responses

5. **Implement Caching Layer**
   - In-memory cache for static data (sets, types)
   - TTL-based cache invalidation
   - Cache-aside pattern for frequently accessed cards
   - Cache headers for CDN integration

6. **Update Frontend to Use BFF**
   - Update React hooks to call `/bff/*` endpoints
   - Remove direct API calls from components
   - Implement optimistic updates where appropriate

**Deliverables:**

- BFF endpoints serving aggregated data
- Frontend using BFF for all data needs
- Caching reducing API calls by 50%+
- Graceful degradation on API failures

**Acceptance Criteria:**

- Dashboard loads with single `/bff/dashboard` call
- Browse page loads in <200ms (cached)
- Partial responses on API failures
- No direct API calls from frontend components

---

### Phase 4: Remove Legacy API from Web

**Goal:** Clean up legacy API code from web application.

**Duration Target:** Clean separation of concerns

**Tasks:**

1. **Remove Legacy API Code**
   - Delete `src/server/lib/api/` directory
   - Remove API route handling from `handleRequest.ts`
   - Clean up unused imports and dependencies

2. **Update Server Configuration**
   - Remove GraphQL server initialization
   - Update request routing to only handle web + BFF
   - Simplify middleware chain

3. **Update Docker Configuration**
   - Add REST API service to docker-compose
   - Add GraphQL API service to docker-compose
   - Configure service networking
   - Update health checks

4. **Update Environment Configuration**
   - Add `REST_API_URL` environment variable
   - Add `GRAPHQL_API_URL` environment variable
   - Configure service discovery

5. **Implement Service Health Monitoring**
   - BFF health check includes downstream services
   - Circuit breaker for failing services
   - Fallback responses for degraded mode

**Deliverables:**

- Web app contains only SSR and BFF code
- Services communicate via HTTP
- Docker Compose orchestrates all services
- Health checks verify full system

**Acceptance Criteria:**

- `apps/web/src/server/lib/api/` deleted
- All tests pass with new architecture
- Docker Compose starts all services
- System recovers from individual service failures

---

### Phase 5: Production Hardening

**Goal:** Production-ready deployment with monitoring and resilience.

**Duration Target:** Production-grade reliability

**Tasks:**

1. **Add Observability**
   - Structured logging (JSON format)
   - Request tracing with correlation IDs
   - Metrics collection (Prometheus format)
   - Error tracking integration

2. **Implement Rate Limiting**
   - REST API rate limiting (1000 req/min)
   - GraphQL complexity-based limiting
   - BFF rate limiting per user session

3. **Add Circuit Breakers**
   - Circuit breaker for REST API calls
   - Circuit breaker for GraphQL calls
   - Fallback responses during outages

4. **Configure TLS/Security**
   - HTTPS for all services
   - API key authentication for service-to-service
   - CORS configuration
   - Security headers

5. **Performance Optimization**
   - Connection pooling tuning
   - Response compression
   - HTTP/2 support
   - Cache header optimization

6. **Create Deployment Manifests**
   - Kubernetes manifests (optional)
   - Docker Compose production config
   - Health check configurations
   - Resource limits

**Deliverables:**

- Production-ready Docker images
- Monitoring dashboards
- Runbook documentation
- Load testing results

**Acceptance Criteria:**

- 99.9% uptime capability
- <100ms p95 latency for cached requests
- <500ms p95 latency for uncached requests
- Graceful handling of 10x traffic spikes

---

## Technical Decisions

### Why Bun for All Services?

- **Consistency**: Same runtime across frontend and API services
- **Performance**: Native TypeScript execution, fast HTTP handling
- **Simplicity**: Fewer moving parts, unified tooling
- **Built-in SQLite**: Native `bun:sqlite` for read-only access

### Why Keep SQLite for Read Operations?

- **Speed**: Local file access faster than network PostgreSQL for reads
- **Simplicity**: No connection management for read-only queries
- **Cron Sync**: Cron service keeps SQLite in sync with PostgreSQL
- **Future**: Can transition to PostgreSQL-only when write operations needed

### Why Separate REST and GraphQL Services?

- **Optimization**: Each service optimized for its protocol
- **Scaling**: Scale GraphQL (complex queries) independently from REST (simple CRUD)
- **Team Ownership**: Different teams can own different services
- **Technology Evolution**: Can evolve protocols independently

### Why BFF Pattern Instead of API Gateway?

- **Frontend Ownership**: Frontend team controls data shaping
- **Simplicity**: No additional infrastructure (Kong, Envoy, etc.)
- **Flexibility**: Custom aggregation logic per page/component
- **Caching**: Frontend-specific caching strategies

### Service Communication Protocol

- **HTTP/JSON**: Simple, debuggable, well-understood
- **No gRPC**: Overkill for current scale, adds complexity
- **Future**: Can add gRPC for internal service mesh if needed

---

## Configuration

### Environment Variables

#### REST API Service

```bash
# Server
REST_API_PORT=3001
REST_API_HOST=0.0.0.0

# Database
DATABASE_PATH=./database/pokemon-data.sqlite3.db
DATABASE_READONLY=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGINS=http://localhost:3000,https://pokemon.example.com
```

#### GraphQL API Service

```bash
# Server
GRAPHQL_API_PORT=3002
GRAPHQL_API_HOST=0.0.0.0

# Database
DATABASE_PATH=./database/pokemon-data.sqlite3.db
DATABASE_READONLY=true

# Apollo
APOLLO_INTROSPECTION=true
APOLLO_PLAYGROUND=true
GRAPHQL_COMPLEXITY_LIMIT=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

#### Web BFF

```bash
# Server
WEB_PORT=3000
WEB_HOST=0.0.0.0

# Downstream Services
REST_API_URL=http://localhost:3001
GRAPHQL_API_URL=http://localhost:3002

# BFF Caching
BFF_CACHE_TTL_SECONDS=300
BFF_CACHE_MAX_SIZE=1000

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT_MS=30000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Docker Configuration

### docker-compose.yml Updates

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '3000:3000'
    environment:
      - REST_API_URL=http://rest-api:3001
      - GRAPHQL_API_URL=http://graphql-api:3002
    depends_on:
      rest-api:
        condition: service_healthy
      graphql-api:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  rest-api:
    build:
      context: .
      dockerfile: apps/rest-api/Dockerfile
    ports:
      - '3001:3001'
    environment:
      - DATABASE_PATH=/data/pokemon-data.sqlite3.db
      - LOG_LEVEL=info
    volumes:
      - ./database:/data:ro
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
      interval: 30s
      timeout: 10s
      retries: 3

  graphql-api:
    build:
      context: .
      dockerfile: apps/graphql-api/Dockerfile
    ports:
      - '3002:3002'
    environment:
      - DATABASE_PATH=/data/pokemon-data.sqlite3.db
      - LOG_LEVEL=info
    volumes:
      - ./database:/data:ro
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002/health']
      interval: 30s
      timeout: 10s
      retries: 3

  # Existing services...
  postgres:
    # ... unchanged

  neo4j:
    # ... unchanged

  tcg-api:
    # ... Rust API unchanged
```

### Dockerfile Templates

#### REST API Dockerfile

```dockerfile
FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY apps/rest-api/package.json ./apps/rest-api/
COPY packages/ ./packages/
RUN bun install --frozen-lockfile

# Build
FROM deps AS build
COPY apps/rest-api/ ./apps/rest-api/
WORKDIR /app/apps/rest-api
RUN bun run build

# Production
FROM base AS production
COPY --from=build /app/apps/rest-api/dist ./dist
COPY --from=build /app/apps/rest-api/package.json ./

USER bun
EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
```

#### GraphQL API Dockerfile

```dockerfile
FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY apps/graphql-api/package.json ./apps/graphql-api/
COPY packages/ ./packages/
RUN bun install --frozen-lockfile

# Build
FROM deps AS build
COPY apps/graphql-api/ ./apps/graphql-api/
WORKDIR /app/apps/graphql-api
RUN bun run build

# Production
FROM base AS production
COPY --from=build /app/apps/graphql-api/dist ./dist
COPY --from=build /app/apps/graphql-api/package.json ./

USER bun
EXPOSE 3002
CMD ["bun", "run", "dist/index.js"]
```

---

## Package Dependencies

### REST API Package

```json
{
  "name": "@pokemon/rest-api",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "start:dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=bun",
    "check-types": "tsc -p ./tsconfig.json --noEmit",
    "test": "bun test",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@pokemon/database": "workspace:*",
    "@pokemon/logger": "workspace:*",
    "@pokemon/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "5.5.4"
  }
}
```

### GraphQL API Package

```json
{
  "name": "@pokemon/graphql-api",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "start:dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=bun",
    "check-types": "tsc -p ./tsconfig.json --noEmit",
    "test": "bun test",
    "lint": "eslint src/",
    "codegen": "graphql-codegen"
  },
  "dependencies": {
    "@apollo/server": "^4.11.0",
    "@pokemon/database": "workspace:*",
    "@pokemon/logger": "workspace:*",
    "@pokemon/utils": "workspace:*",
    "dataloader": "^2.2.3",
    "graphql": "^16.9.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.3",
    "@graphql-codegen/typescript": "^4.1.2",
    "@graphql-codegen/typescript-resolvers": "^4.4.1",
    "@types/bun": "latest",
    "typescript": "5.5.4"
  }
}
```

---

## Testing Strategy

### Unit Tests

**REST API:**

- Route pattern matching
- Request validation
- Response transformation
- Pagination calculations
- Error handling

**GraphQL API:**

- Resolver functions
- DataLoader batching
- Query complexity calculation
- Schema validation
- Error formatting

**BFF:**

- Response aggregation logic
- Cache key generation
- Circuit breaker state transitions
- Fallback response generation

### Integration Tests

**REST API:**

- Full request/response cycle
- Database query execution
- Pagination across endpoints
- Error response format

**GraphQL API:**

- Query execution with real schema
- DataLoader batch verification
- Nested resolver resolution
- Error propagation

**BFF:**

- Service client HTTP calls
- Response aggregation
- Cache hit/miss scenarios
- Timeout handling

### End-to-End Tests

- Full user journey through UI
- Service mesh communication
- Failure recovery scenarios
- Performance under load

### Load Testing

```bash
# REST API: 1000 req/sec target
wrk -t12 -c400 -d30s http://localhost:3001/api/v1/cards

# GraphQL API: Complex query performance
k6 run graphql-load-test.js

# BFF: Aggregation performance
k6 run bff-load-test.js
```

---

## Success Metrics

| Metric                    | Current | Target          |
| ------------------------- | ------- | --------------- |
| Time to First Byte (TTFB) | ~300ms  | <100ms (cached) |
| API Response Time (p95)   | ~200ms  | <100ms          |
| BFF Aggregation Time      | N/A     | <150ms          |
| Service Independence      | 0%      | 100%            |
| Cache Hit Rate            | 0%      | >80%            |
| Deployment Frequency      | Weekly  | Daily           |
| Mean Time to Recovery     | Hours   | <5 minutes      |

---

## Migration Checklist

### Pre-Migration

- [ ] All existing tests passing
- [ ] API documentation complete
- [ ] Performance baseline established
- [ ] Rollback plan documented

### Phase 1: REST API

- [ ] Project initialized
- [ ] Handlers migrated
- [ ] Router implemented
- [ ] Middleware added
- [ ] Tests passing
- [ ] Running independently

### Phase 2: GraphQL API

- [ ] Project initialized
- [ ] Schema migrated
- [ ] Resolvers migrated
- [ ] DataLoaders implemented
- [ ] Tests passing
- [ ] Running independently

### Phase 3: BFF Layer

- [ ] BFF infrastructure created
- [ ] API clients implemented
- [ ] Handlers implemented
- [ ] Caching added
- [ ] Frontend updated
- [ ] Tests passing

### Phase 4: Cleanup

- [ ] Legacy API code removed
- [ ] Docker Compose updated
- [ ] Environment variables configured
- [ ] Health checks verified
- [ ] All tests passing

### Phase 5: Production

- [ ] Observability added
- [ ] Rate limiting configured
- [ ] Circuit breakers tested
- [ ] Security hardened
- [ ] Load tested
- [ ] Documentation complete

---

## Appendix: Request Flow Diagrams

### Dashboard Page Load

```
Browser                 BFF                  REST API           GraphQL API
   │                     │                      │                    │
   │ GET /dashboard      │                      │                    │
   │────────────────────>│                      │                    │
   │                     │                      │                    │
   │                     │ GET /bff/dashboard   │                    │
   │                     │──────────┬───────────│────────────────────│
   │                     │          │           │                    │
   │                     │          │ GET /api/v1/sets?limit=5       │
   │                     │          │──────────>│                    │
   │                     │          │           │                    │
   │                     │          │ query { stats { ... } }        │
   │                     │          │───────────│───────────────────>│
   │                     │          │           │                    │
   │                     │<─────────┴───────────│<───────────────────│
   │                     │   (parallel responses)                    │
   │                     │                      │                    │
   │                     │  aggregate & cache   │                    │
   │                     │─────────────────────>│                    │
   │                     │                      │                    │
   │<────────────────────│                      │                    │
   │   DashboardData     │                      │                    │
   │                     │                      │                    │
   │ Hydrate React       │                      │                    │
   │──────────────────── │                      │                    │
```

### Card Detail with Related Cards

```
Browser                 BFF                  GraphQL API
   │                     │                      │
   │ GET /browse/sv8-25  │                      │
   │────────────────────>│                      │
   │                     │                      │
   │                     │ query {              │
   │                     │   card(id: "sv8-25") │
   │                     │   relatedCards(...)  │
   │                     │ }                    │
   │                     │─────────────────────>│
   │                     │                      │
   │                     │<─────────────────────│
   │                     │   CardDetailData     │
   │                     │                      │
   │<────────────────────│                      │
   │   CardDetailData    │                      │
```

---

## Appendix: Error Handling

### Error Response Format

All services use consistent error format:

```typescript
interface ServiceError {
  error: {
    code: string; // Machine-readable code
    message: string; // Human-readable message
    status: number; // HTTP status code
    service: string; // Originating service
    requestId: string; // Correlation ID
    details?: unknown; // Additional context
  };
}
```

### BFF Error Aggregation

When downstream services fail, BFF returns partial data:

```typescript
interface PartialResponse<T> {
  data: Partial<T>;
  errors?: Array<{
    source: string;
    code: string;
    message: string;
  }>;
  warnings?: string[];
}
```

### Circuit Breaker States

```
CLOSED ──(failures > threshold)──> OPEN
   ↑                                  │
   │                                  │
   └──(success)── HALF_OPEN <────(timeout)
```

---

## Appendix: Caching Strategy

### Cache Layers

1. **BFF In-Memory Cache** (TTL: 5 minutes)
   - Dashboard data
   - Set list
   - Filter options

2. **HTTP Cache Headers** (CDN)
   - Static assets: `Cache-Control: public, max-age=31536000`
   - API responses: `Cache-Control: public, max-age=300, stale-while-revalidate=60`
   - User-specific: `Cache-Control: private, no-cache`

3. **Browser Cache**
   - Service Worker for offline support (future)
   - IndexedDB for card collection (future)

### Cache Invalidation

- **Time-based**: TTL expiration
- **Event-based**: Cron sync triggers invalidation
- **Manual**: Admin API to clear caches
