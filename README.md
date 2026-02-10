# Project Johto

A Pokemon Trading Card Game platform built as a Turborepo monorepo. The stack combines a React 19 SSR frontend (Bun), a high-performance Rust GraphQL API, TypeScript microservices, PostgreSQL, Neo4j, and an experimental distributed ledger for card ownership.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│    └── apps/web  (React 19 SSR · Bun · port 3000)               │
│          ├── apps/rest-api      (REST    · Bun · port 3001)     │
│          ├── apps/graphql-api   (Apollo  · Bun · port 3002)     │
│          └── apps/tcg-api       (GraphQL · Rust· port 8080)     │
│                  ├── postgres   (relational data)               │
│                  └── neo4j      (graph relationships)           │
│                                                                 │
│  Background                                                     │
│    └── apps/cron                (scheduler · Bun)               │
│                                                                 │
│  Tooling                                                        │
│    ├── apps/scripts             (data sync CLI · Bun)           │
│    └── apps/distributed-ledger  (blockchain · Rust)             │
└─────────────────────────────────────────────────────────────────┘
```

All services run on a shared Docker network (`pika`) and are orchestrated through a single `docker compose` command.

---

## Monorepo Layout

```
Pokemon/
├── apps/
│   ├── web/                  # React 19 SSR frontend
│   ├── tcg-api/              # Rust · Actix-web · async-graphql
│   ├── graphql-api/          # Apollo GraphQL (Bun)
│   ├── rest-api/             # REST API (Bun)
│   ├── cron/                 # Background job scheduler (Bun)
│   ├── scripts/              # Data-sync CLI (Bun)
│   └── distributed-ledger/   # Blockchain prototype (Rust)
├── packages/
│   ├── @build/               # Build presets & runner
│   ├── @clients/             # Pokemon TCG API client
│   ├── @configs/             # Shared tsconfig presets
│   ├── @database/            # PostgreSQL · SQLite · Neo4j adapters
│   ├── @framework/           # Zero-dep Bun microservice framework
│   ├── @logger/              # Namespaced debug logger
│   ├── @pokemon-data/        # Static card & set JSON data
│   └── @utils/               # Zod schemas & type guards
├── docker/
│   └── database/             # PostgreSQL & Neo4j compose + init SQL
├── docker-compose.yml        # Root orchestrator (includes per-app composes)
├── turbo.json                # Turborepo task graph
├── package.json              # Root workspace manifest
├── .mise.toml                # Dev toolchain (Bun, Node, Rust)
└── .claude/                  # Claude Code project configuration
```

---

## Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Frontend       | React 19.2, TypeScript 5.5, Webpack 5, Storybook 8.5            |
| Runtime        | Bun 1.3.5 (TS execution, bundler, test runner, package manager) |
| Rust API       | Actix-web 4.9, async-graphql 7.0, Tokio, serde                  |
| Databases      | PostgreSQL 16 (sqlx), Neo4j (neo4rs), SQLite (local sync)       |
| GraphQL        | async-graphql (Rust), Apollo Server (Bun)                       |
| Validation     | Zod 4                                                           |
| Build          | Turborepo 2.3, esbuild                                          |
| Infrastructure | Docker, docker-compose                                          |
| Dev Tooling    | mise, ESLint, Prettier, Cargo                                   |

---

## Apps

### `web` — React SSR Frontend

Server-side rendered React 19 application. Consumes both the REST and GraphQL APIs. Built with Webpack 5 + Babel + React Compiler. Storybook is co-located for component development.

**Ports:** `3000` (app) · `6006` (Storybook)

### `tcg-api` — Rust GraphQL API

The primary data API. Written in Rust with Actix-web and async-graphql. Connects to PostgreSQL (via sqlx with compile-time query checking) and Neo4j (via neo4rs) for graph queries such as evolution chains and deck synergies.

**Port:** `8080`

### `graphql-api` — Apollo GraphQL API

A secondary GraphQL service built on Apollo Server with DataLoader for request batching. Reads from a local SQLite snapshot for low-latency queries.

**Port:** `3002`

### `rest-api` — REST API

REST endpoints built on the internal `@pokemon/framework`. Reads from the same SQLite snapshot. Provides an alternative entry point for simple CRUD operations.

**Port:** `3001`

### `cron` — Background Scheduler

Runs recurring jobs: data synchronisation from `@pokemon/data` to SQLite, automated database backups with retention, PostgreSQL replication, and health monitoring. Supports job dependencies and exclusive-execution locks.

### `scripts` — Data Sync CLI

Command-line tool for seeding and synchronising Pokemon TCG data. Supports JSON sync, fork-repository sync, and rich terminal output. Primary entry point in Docker is `docker:scripts:db:sync`.

### `distributed-ledger` — Blockchain Prototype

Early-stage Rust application for decentralised card-ownership tracking. Custom blockchain implementation.

---

## Packages

| Package              | Purpose                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `@pokemon/build`     | Build presets (library, server, browser), concurrent build runner, output reporter                        |
| `@pokemon/clients`   | Async `PokemonTCGClient` for querying the official Pokemon TCG API with pagination                        |
| `@pokemon/configs`   | Shared `tsconfig.json` presets: base, bun, react                                                          |
| `@pokemon/database`  | Unified adapter for PostgreSQL, SQLite, and Neo4j — connection pools, insert helpers, graph operations    |
| `@pokemon/framework` | Zero-dependency Bun HTTP framework: router, DI container, middleware (CORS, rate-limit, security headers) |
| `@pokemon/logger`    | Namespaced debug logger with chalk styling and emoji support                                              |
| `@pokemon/data`      | Static JSON card & set data for 50+ Pokemon TCG sets. Lazy-loaded via Bun File API                        |
| `@pokemon/utils`     | Zod-based validation schemas and type guards for cards, attacks, sets, weaknesses, and resistances        |

---

## Getting Started

### Prerequisites

[mise](https://mise.jdx.dev/) manages the dev toolchain. After cloning, run:

```sh
mise install
```

This provisions **Bun 1.3.5**, **Node 24.6**, and **Rust 1.92.0**.

### Install Dependencies

```sh
mise run install
```

### Start Everything with Docker

The fastest way to run the full platform locally:

```sh
docker compose up --build
```

All services start in dependency order. Once healthy:

| Service          | URL                     |
| ---------------- | ----------------------- |
| Web frontend     | `http://localhost:3000` |
| REST API         | `http://localhost:3001` |
| Apollo GraphQL   | `http://localhost:3002` |
| Rust GraphQL API | `http://localhost:8080` |
| Neo4j Browser    | `http://localhost:7474` |

### Run Locally (without Docker)

```sh
# Terminal 1 — databases (required by tcg-api)
docker compose up postgres neo4j

# Terminal 2 — Rust API
cd apps/tcg-api
cargo run

# Terminal 3 — frontend + Bun services
bun run dev
```

---

## Common Tasks

```sh
# Run all tests
mise run test          # or: bun run test

# Lint
mise run lint          # or: bun run lint

# Type-check
bun run check-types

# Format
bun run format

# Build everything
mise run build         # or: bun run build

# Sync Pokemon data into the database
bun run docker:scripts:db:sync

# Sync card JSON locally
bun run json:sync

# Storybook (frontend components)
cd apps/web
bun run storybook
```

---

## Docker Details

All Dockerfiles use multi-stage builds. Bun-based services run as non-root users. Every service exposes a health-check endpoint used by Docker for dependency ordering and auto-restart.

### Service → Port Map

| Service                  | Port        | Protocol    |
| ------------------------ | ----------- | ----------- |
| `bun-pokemon-web-server` | 3000        | HTTP        |
| `rest-api`               | 3001        | HTTP        |
| `graphql-api`            | 3002        | HTTP        |
| `rs-tcg-api`             | 8080        | HTTP        |
| `postgres`               | 5432        | PostgreSQL  |
| `neo4j`                  | 7687 / 7474 | Bolt / HTTP |

### Network

All containers share the `pika` network and communicate by service name (e.g., `http://rest-api:3001`).

### Database Initialisation

PostgreSQL is bootstrapped via `docker/database/init.sql`, which creates the `users`, `pokemon_card_sets`, and `pokemon_cards` tables. Neo4j uses a custom image with curl added for health checks.

---

## Database Schema (PostgreSQL)

| Table               | Key Columns                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`             | `id`, `username`, `email`, `password`, `created_at`                                                                                                               |
| `pokemon_card_sets` | `id`, `name`, `series`, `printed_total`, `total`, `legalities`, `images`, `release_date`                                                                          |
| `pokemon_cards`     | `id`, `name`, `supertype`, `subtypes`, `types`, `hp`, `evolves_from`, `attacks`, `weaknesses`, `set_id` (FK), `rarity`, `images`, pricing (TCGPlayer, Cardmarket) |

Neo4j stores evolution relationships, deck synergies, card combos, and type-effectiveness graphs.

---

## Environment Variables

Sensitive configuration lives in `.env` files (gitignored). Key variables:

| Variable               | Used by                           | Example                                            |
| ---------------------- | --------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | `tcg-api`                         | `postgresql://user:pass@localhost:5432/pokemon_db` |
| `NEO4J_URI`            | `tcg-api`                         | `bolt://localhost:7687`                            |
| `REST_API_URL`         | `web`                             | `http://rest-api:3001`                             |
| `GRAPHQL_API_URL`      | `web`                             | `http://graphql-api:3002`                          |
| `DATABASE_PATH`        | `rest-api`, `graphql-api`, `cron` | `/data/pokemon-data.sqlite3.db`                    |
| `APOLLO_INTROSPECTION` | `graphql-api`                     | `true`                                             |

Per-service `.env` templates live alongside each app's `docker-compose.yml`.
