# Configuration reference

All BFF configuration is loaded from environment variables at startup by `src/server/bff/config.ts`. Every value has a default so the BFF works out of the box in local development without a `.env` file.

## Variables

| Variable | Default | Description |
|---|---|---|
| `REST_API_URL` | `http://localhost:3001` | Base URL of the REST microservice. No trailing slash. |
| `GRAPHQL_API_URL` | `http://localhost:3002` | Base URL of the GraphQL microservice. The client appends `/graphql` to this. |
| `BFF_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds for the typed clients (`RestApiClient`, `GraphQLClient`). Requests that do not receive a response within this window are aborted. |
| `CIRCUIT_BREAKER_THRESHOLD` | `5` | Number of consecutive failures before a circuit breaker opens. Applies to both the REST and GraphQL circuit breakers. |
| `CIRCUIT_BREAKER_TIMEOUT_MS` | `30000` | Duration in milliseconds that a circuit stays open before transitioning to half-open and allowing a single probe request. |
| `BFF_CACHE_TTL_SECONDS` | `300` | Default TTL for the in-memory cache in seconds. Individual handlers may override this (e.g., card detail uses 120 seconds, browse filters use 300 seconds). |
| `BFF_CACHE_MAX_SIZE` | `1000` | Maximum number of entries in the in-memory cache before eviction begins. |

## Tuning guidelines

### `BFF_TIMEOUT_MS`

This must be **less than** any upstream timeout or load balancer timeout that sits in front of the BFF. If a load balancer kills the connection after 15 seconds, a BFF timeout of 30 seconds is useless — the client will never see the response. A safe default is roughly half the upstream timeout.

The typed clients apply this timeout independently per request. A handler that makes two sequential calls (like `getCardDetail`) can take up to `2 × BFF_TIMEOUT_MS` in the worst case before it responds. If that is a concern, consider reducing the timeout or making the calls concurrent.

### `CIRCUIT_BREAKER_THRESHOLD`

Lower values make the circuit more sensitive — fewer failures are needed to trip it. A value of 1 means any single failure opens the circuit, which is aggressive and can cause unnecessary outages if the downstream has transient errors. The default of 5 is a reasonable balance: it tolerates a few blips before assuming the service is down.

Note that the failure counter resets to 0 on any success. The threshold is consecutive failures, not failures within a time window.

### `CIRCUIT_BREAKER_TIMEOUT_MS`

This controls how long the BFF stops trying to reach a downed service. 30 seconds is a conservative default. In a high-traffic environment you might reduce this to 10–15 seconds so the BFF probes the service more frequently. In a low-traffic environment the default is fine — there is no cost to waiting, and a shorter timeout risks reopening the circuit before the service has actually recovered.

### Cache TTLs

The per-handler cache TTLs are currently hardcoded in the handler files rather than reading from config:

| Handler | Cache key prefix | TTL |
|---|---|---|
| `getCardDetail` | `bff:card:` | 120 seconds (2 minutes) |
| `getBrowse` (filters only) | `bff:browse:filters` | 300 seconds (5 minutes) |

Card detail is cached shorter because individual cards can have their data updated (e.g., marketplace prices change). Browse filters are cached longer because the set of available types, rarities, and sets changes only when new card data is synced.

## Docker environment

When running under Docker Compose, the downstream service URLs point to the container hostnames defined in `docker-compose.yml` rather than `localhost`:

```yaml
environment:
  - REST_API_URL=http://tcg-api:3001
  - GRAPHQL_API_URL=http://tcg-api:3002
```

Both the REST and GraphQL APIs are served by the same Rust process (`tcg-api`) on different ports, so they share a single container hostname.
