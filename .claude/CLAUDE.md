# Project Johto: Pokemon TCG Platform

## Project Overview

Project Johto is a comprehensive Pokemon Trading Card Game platform built as a Turborepo monorepo. The architecture combines a modern React SSR frontend with a high-performance Rust backend, PostgreSQL and Neo4j databases, and an experimental distributed ledger for card ownership tracking.

**Core Goals:**
- Server-side rendered React 19 frontend with Bun runtime
- High-performance GraphQL API built with Rust and Actix-web
- Multi-database architecture (PostgreSQL for relational data, Neo4j for graph relationships)
- Distributed ledger for card ownership and trading
- Comprehensive Pokemon TCG data management and synchronization
- Docker-based development and deployment environment

## Architecture

### Frontend (apps/web)

- **Framework**: React 19 with server-side rendering
- **Runtime**: Bun 1.3.5 for fast TypeScript execution
- **Build System**: Webpack 5 with Babel + React Compiler
- **Styling**: CSS with component-scoped styles
- **Development**: Storybook for component development
- **Type Safety**: TypeScript with strict mode

### Backend API (apps/tcg-api)

- **Language**: Rust with Actix-web framework
- **API Style**: GraphQL with async-graphql
- **Databases**:
  - PostgreSQL via sqlx (relational data, cards, sets)
  - Neo4j via neo4rs (graph relationships, card interactions)
- **Async Runtime**: Tokio
- **Serialization**: Serde for JSON handling

### Blockchain (apps/distributed-ledger)

- **Language**: Rust
- **Purpose**: Decentralized card ownership tracking
- **Architecture**: Custom blockchain implementation

### Data Management (apps/scripts)

- **Runtime**: Bun + JavaScript/TypeScript
- **Purpose**: Pokemon TCG data synchronization and processing
- **Formats**: JSON data processing and database seeding

### Shared Packages

- **@pokemon/clients**: API clients and HTTP utilities
- **@pokemon/configs**: Shared TypeScript and build configurations
- **@pokemon/database**: Database connection and ORM utilities
- **@pokemon/logger**: Centralized logging utilities
- **@pokemon/pokemon-data**: Pokemon TCG card and set data
- **@pokemon/utils**: Shared utility functions

## Development Standards

### TypeScript & React

- **Strict Mode**: All TypeScript code uses strict mode
- **Explicit Types**: Function parameters and returns always typed
- **React 19 Features**: Use canary features for advanced SSR patterns
- **Functional Components**: Only functional components with hooks
- **Component Structure**: Organize by feature with co-located tests and styles

### Rust Standards

- **Edition**: Rust 2021
- **Error Handling**: Use `anyhow::Result` for error propagation
- **Async**: Tokio runtime with async/await patterns
- **Serialization**: Serde with derive macros for JSON
- **Database**: sqlx with compile-time query checking
- **API**: async-graphql for type-safe GraphQL schemas

### Component Patterns (React)

**File Structure:**
```
ComponentName/
├── index.ts          # Barrel export
├── ComponentName.tsx # Component implementation
├── ComponentName.css # Component styles
├── types.ts          # TypeScript types
└── __tests__/        # Component tests
```

### API Patterns (Rust)

**File Structure:**
```
feature/
├── mod.rs            # Module exports
├── models.rs         # Data models
├── handlers.rs       # Request handlers
├── schema.rs         # GraphQL schema
└── tests.rs          # Unit tests
```

## Technical Decisions

### Why React 19 SSR?

Server-side rendering provides:
- Fast initial page loads with hydrated HTML
- Better SEO for Pokemon TCG content
- Progressive enhancement capabilities
- Improved Core Web Vitals

### Why Bun Runtime?

Bun provides:
- Native TypeScript execution without transpilation
- Fast package management and installation
- Built-in test runner and bundler
- Superior developer experience and performance
- Drop-in Node.js replacement with better APIs

### Why Rust for Backend?

Rust provides:
- Memory safety without garbage collection
- Fearless concurrency with Tokio
- Zero-cost abstractions
- Excellent performance for high-traffic APIs
- Strong type system preventing runtime errors

### Why Multi-Database Architecture?

- **PostgreSQL**: Excellent for relational data (cards, sets, users, collections)
- **Neo4j**: Perfect for graph relationships (card evolutions, deck synergies, combos)
- **Distributed Ledger**: Immutable ownership records for trading verification

### Why Turborepo?

Turborepo provides:
- Fast incremental builds with intelligent caching
- Parallel task execution across workspaces
- Simple configuration for complex monorepos
- Remote caching for CI/CD optimization

## Common Operations

### Development Server

```bash
# Start all services with Docker
docker compose up

# Start frontend only
cd apps/web
bun run dev

# Start API only
cd apps/tcg-api
cargo run

# Start all apps (Turborepo)
bun run dev
```

### Database Operations

```bash
# Start databases
docker compose up postgres neo4j

# Sync Pokemon data to database
bun run docker:scripts:db:sync

# Run database migrations
cd apps/tcg-api
sqlx migrate run
```

### Build & Deploy

```bash
# Build all workspaces
bun run build

# Build frontend
cd apps/web
bun run build

# Build API
cd apps/tcg-api
cargo build --release

# Build with Docker
docker compose build
```

### Data Management

```bash
# Sync Pokemon TCG data from JSON
bun run json:sync

# Clean duplicate cards
cd apps/scripts
node cleanup-duplicate-cards.cjs
```

### Testing

```bash
# Run all tests
bun run test

# Test frontend
cd apps/web
bun test

# Test API
cd apps/tcg-api
cargo test
```

### Code Quality

```bash
# Lint all code
bun run lint

# Format code
bun run format

# Type check
bun run check-types
```

## Monorepo Structure

```
Pokemon/
├── apps/
│   ├── web/                    # React SSR frontend
│   ├── tcg-api/                # Rust GraphQL API
│   ├── distributed-ledger/     # Rust blockchain
│   └── scripts/                # Data management scripts
├── packages/
│   ├── @clients/               # API clients
│   ├── @configs/               # Shared configs
│   ├── @database/              # Database utilities
│   ├── @logger/                # Logging utilities
│   ├── @pokemon-data/          # TCG data
│   └── @utils/                 # Shared utilities
├── docker/                     # Docker configurations
├── database/                   # Local database files
├── docker-compose.yml          # Service orchestration
├── turbo.json                  # Turborepo configuration
└── .claude/                    # Claude Code configuration
```

## Tech Stack

### Frontend
- **React 19.2** with SSR
- **TypeScript 5.5** with strict mode
- **Bun 1.3.5** runtime and package manager and bundler
- **Storybook 8.5** for component development

### Backend
- **Rust** with Actix-web 4.9
- **async-graphql 7.0** for GraphQL
- **sqlx 0.8** for PostgreSQL
- **neo4rs 0.8** for Neo4j
- **Tokio** async runtime

### Infrastructure
- **PostgreSQL** for relational data
- **Neo4j** for graph data
- **Docker** for containerization
- **Turborepo 2.3** for monorepo orchestration

### Development Tools
- **ESLint** for linting
- **Prettier** for formatting
- **Storybook** for component dev
- **Cargo** for Rust tooling

## Project-Specific Patterns

### Pokemon TCG Data Structure

Cards are stored with:
- Unique identifiers and set information
- Card attributes (HP, attacks, abilities, types)
- Rarity and collector information
- Image assets and artwork
- Market pricing data
- Evolution chains and relationships

### Database Schema

**PostgreSQL Tables:**
- `sets` - Pokemon TCG set information
- `pokemon_cards` - Individual card data
- `users` - User accounts
- `collections` - User card collections
- `trades` - Trading history

**Neo4j Graph:**
- Card evolution relationships
- Deck synergy networks
- Card combo patterns
- Type effectiveness graphs

### API Design

GraphQL queries and mutations for:
- Card search and filtering
- Set browsing
- Collection management
- Trading operations
- Deck building
- Analytics and statistics

## Development Workflow

### Adding a New Feature (Frontend)

1. Create component in `apps/web/src/web/components/`
2. Add TypeScript types in `types.ts`
3. Implement component logic
4. Create Storybook story
5. Add component tests
6. Update routes if needed

### Adding a New API Endpoint (Backend)

1. Define GraphQL schema in `schema.rs`
2. Create database models in `models/mod.rs`
3. Implement handlers in `handlers.rs`
4. Add database queries
5. Write unit tests
6. Update API documentation

### Adding New Pokemon Data

1. Place JSON data in `packages/@pokemon-data/data/cards/`
2. Run data sync script
3. Validate database entries
4. Update TypeScript types if needed
5. Test API queries

## Environment Configuration

### Required Environment Variables

**Frontend (.env):**
```
API_URL=http://localhost:8080
NODE_ENV=development
```

**Backend (.env):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/pokemon_tcg
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
RUST_LOG=info
```

## Deployment Strategy

### Docker Deployment

All services containerized:
- `web` - Frontend SSR server
- `tcg-api` - GraphQL API server
- `postgres` - PostgreSQL database
- `neo4j` - Neo4j graph database
- `distributed-ledger` - Blockchain node

### Production Build

```bash
# Build optimized containers
docker compose -f docker-compose.prod.yml build

# Deploy to production
docker compose -f docker-compose.prod.yml up -d
```

## Performance Considerations

- SSR caching for frequently accessed pages
- Database query optimization with indexes
- Connection pooling for PostgreSQL
- GraphQL query complexity limiting
- Asset optimization and code splitting
- CDN for static Pokemon card images

## Security Considerations

- Input validation on all API endpoints
- SQL injection prevention with parameterized queries
- CORS configuration for API access
- Environment variable management
- Secure password hashing
- Rate limiting on API endpoints
