# Proxy layer

The proxy layer (`src/server/bff/proxy.ts`) handles requests that should be forwarded to a downstream microservice without transformation. It is the simplest path through the BFF — no aggregation, no caching, no data reshaping — but it does add circuit breaker protection on top of the raw fetch.

## When the proxy is used

`server.ts` routes two path prefixes to the proxy:

| Prefix                  | Proxy function        | Downstream target            |
| ----------------------- | --------------------- | ---------------------------- |
| `/api/v1/*`             | `proxyToRestApi()`    | REST API (`apps/tcg-api`)    |
| `/graphql`, `/graphiql` | `proxyToGraphqlApi()` | GraphQL API (`apps/tcg-api`) |

These paths exist so the browser can make **client-side API calls after hydration** without knowing the internal service addresses. For example, when the user pages through browse results, the React component fetches `/api/v1/cards?page=2` — the proxy rewrites that to `http://localhost:3001/api/v1/cards?page=2` and forwards it.

## What the proxy actually does

Three things, in order:

### 1. Short-circuit if the breaker is open

Before any network call is made, the proxy checks the relevant circuit breaker. If it is open, the request is rejected immediately with a 503. No connection to the downstream service is attempted.

```typescript
if (restApiCircuit.isOpen()) {
  return new Response(/* 503 with Retry-After header */);
}
```

### 2. Forward the request

The proxy constructs the target URL by replacing the origin with the configured downstream URL and preserving the path and query string exactly:

```typescript
const url = new URL(request.url); // e.g. http://localhost:3000/api/v1/cards?page=2
const targetUrl = `${bffConfig.restApiUrl}${url.pathname}${url.search}`;
// e.g. http://localhost:3001/api/v1/cards?page=2
```

Headers and body are forwarded as-is. The body is only included for methods other than GET and HEAD (fetch rejects a body on those methods).

### 3. Record the outcome for the circuit breaker

After the upstream response arrives (or the connection fails), the proxy updates the circuit:

| Outcome                 | Action                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| Response status 2xx     | `recordSuccess()` — resets failure count, closes circuit if it was half-open |
| Response status 5xx     | `recordFailure()` — increments failure count, may open circuit               |
| Response status 4xx     | **No action** — client errors are not a sign the service is unhealthy        |
| Network error / timeout | `recordFailure()` — the service is unreachable                               |

This distinction is intentional. A 404 or 422 means the service is running and correctly rejected the request. Only server-side errors and connection failures indicate the service itself is degraded.

## Response headers

Two headers are added to every proxied response for observability:

| Header            | Value                           | Purpose                                                                                      |
| ----------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `X-Proxied-By`    | `bff`                           | Confirms the response passed through the BFF proxy, useful for debugging in browser DevTools |
| `X-Circuit-State` | `CLOSED` / `OPEN` / `HALF_OPEN` | Current state of the circuit breaker for this service at the time the response was sent      |

All other headers from the upstream response are passed through unchanged.

## Error response shapes

When the proxy itself fails (circuit open or network error), it generates a synthetic error response. The shape matches the protocol conventions of the downstream service so that client-side error handling does not need to distinguish between "upstream returned an error" and "the proxy rejected the request":

**For REST (`/api/v1/*`):**

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "REST API is temporarily unavailable",
    "circuitState": "OPEN"
  }
}
```

**For GraphQL (`/graphql`):**

```json
{
  "errors": [
    {
      "message": "GraphQL API is temporarily unavailable",
      "extensions": {
        "code": "SERVICE_UNAVAILABLE",
        "circuitState": "OPEN"
      }
    }
  ]
}
```

The GraphQL error uses the `errors` array format defined by the [GraphQL over HTTP spec](https://graphql.github.io/graphql-over-http/draft/), so standard GraphQL client libraries (Apollo, urql, etc.) will parse it correctly without special handling.

## What the proxy does NOT do

- **No caching.** Cached responses from upstream (via `Cache-Control` etc.) are the upstream's responsibility. The proxy does not add its own cache layer.
- **No authentication.** There is no token injection or credential forwarding. All downstream services are on the internal network and trust the BFF.
- **No retry logic.** A failed request is recorded as a failure and returned to the client. Retries are the client's responsibility (or could be added to the typed clients if needed).
- **No timeout.** The proxy's `fetch` uses the default Bun timeout. Per-request timeouts are handled by the typed clients used in the aggregation path, not here.
