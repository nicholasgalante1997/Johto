# Health Checks

The API exposes two dedicated REST endpoints for liveness and readiness probes. These are separate from the GraphQL `health` query and are designed for use with container orchestrators like Kubernetes or Docker Compose.

---

## Endpoints

### `GET /health` — Liveness Probe

Reports whether the service process is running and the database connection is reachable.

**Healthy response (`200 OK`):**

```json
{
  "service": "pokemon-graphql-api",
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Unhealthy response (`503 Service Unavailable`):**

```json
{
  "service": "pokemon-graphql-api",
  "status": "unhealthy",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

### `GET /ready` — Readiness Probe

Reports whether the service is ready to accept traffic. This checks the same database connectivity as `/health` but is semantically distinct — a service can be alive (liveness) but not yet ready to serve requests (readiness).

Returns `200 OK` or `503 Service Unavailable` with the same payload shape as `/health`.

---

## Docker Compose Health Check

The `docker-compose.yml` configures Docker's built-in health check using the `/health` endpoint:

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3002/health']
  interval: 30s
  timeout: 3s
  retries: 3
```

A container that fails 3 consecutive health checks is marked as **unhealthy** by Docker.

---

## GraphQL Health Query

The GraphQL schema also exposes a `health` query that returns additional detail:

```graphql
{
  health {
    status
    database
    uptime
    timestamp
  }
}
```

This is useful for debugging from GraphiQL but should not be used as an orchestration probe — use the dedicated REST endpoints instead.
