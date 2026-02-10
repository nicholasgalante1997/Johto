# Deployment

The API ships as a single Docker image built with a multi-stage Dockerfile. It is designed to run alongside the rest of the Project Johto platform via Docker Compose.

---

## Docker Image

The Dockerfile uses four stages:

| Stage        | Purpose                                            |
| ------------ | -------------------------------------------------- |
| `base`       | Bun 1.3.5 Alpine image                             |
| `deps`       | Install dependencies with a frozen lockfile        |
| `build`      | Compile TypeScript and bundle to `dist/`           |
| `production` | Minimal runtime image, runs as non-root `bun` user |

```bash
# Build the image
docker build -t pokemon-graphql-api .
```

The production image exposes **port 3002** and includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3002/health || exit 1
```

---

## Docker Compose

The `docker-compose.yml` in the `graphql-api` directory defines the service:

```yaml
services:
  pokemon-graphql-api:
    image: pokemon-graphql-api:latest
    ports:
      - '3002:3002'
    environment:
      - GRAPHQL_API_PORT=3002
      - DATABASE_PATH=/data/pokemon-data.sqlite3.db
      - APOLLO_INTROSPECTION=true
      - CORS_ORIGINS=http://localhost:3000,http://bun-pokemon-web-server:3000
    volumes:
      - ../../database:/data:ro
    networks:
      - pika
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002/health']
      interval: 30s
      timeout: 3s
      retries: 3
```

Key points:

- The database volume is mounted **read-only** — the API never writes to the database.
- The `pika` network allows other Project Johto services to reach this container by hostname.
- CORS is scoped to the web frontend origins.

---

## Running with the Platform

From the monorepo root, the full platform (including the GraphQL API) starts with:

```bash
docker compose up
```

To start only the GraphQL API and its dependencies:

```bash
cd apps/graphql-api
docker compose up pokemon-graphql-api
```

---

## Production Checklist

- [ ] Set `APOLLO_INTROSPECTION=false` to hide the schema from unauthenticated clients
- [ ] Restrict `CORS_ORIGINS` to your production frontend domain(s)
- [ ] Ensure the database file is mounted read-only
- [ ] Use `LOG_FORMAT=json` and set `LOG_LEVEL` to `warn` or `error`
- [ ] Verify the Docker health check passes before routing traffic
