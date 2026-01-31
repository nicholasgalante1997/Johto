# Quick Start

Get the Pokemon GraphQL API running locally.

## Prerequisites

- **Bun** 1.3.5 or later
- Access to the Project Johto monorepo root (the `bun.lock` and workspace packages must be installed)
- The SQLite database file at `database/pokemon-data.sqlite3.db`

## Run from the Monorepo

```bash
# From the monorepo root — install all workspace dependencies
bun install

# Start the GraphQL API in dev mode (watch + hot reload)
cd apps/graphql-api
bun run start:dev
```

The server starts on **port 3002** by default. You should see output like:

```
[info] Pokemon GraphQL API listening on http://0.0.0.0:3002
[info] GraphQL endpoint: http://localhost:3002/graphql
[info] GraphiQL IDE:      http://localhost:3002/graphiql
[info] Health check:      http://localhost:3002/health
```

## Verify It's Working

### Health check

```bash
curl http://localhost:3002/health
```

Expected response:

```json
{
  "service": "pokemon-graphql-api",
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### First query

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ stats { totalCards totalSets } }" }'
```

### Interactive exploration

Open **http://localhost:3002/graphiql** in a browser. The IDE loads with several example queries pre-populated — run `stats` first to confirm connectivity, then explore the card and set queries.

## Next Steps

- [Configuration](configuration.md) — all environment variables and their defaults
- [Queries](api-queries.md) — every available query with arguments and examples
- [Deployment](deployment.md) — Docker and production setup
