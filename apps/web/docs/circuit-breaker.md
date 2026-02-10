# Circuit breaker

The circuit breaker is the resilience layer that prevents a failing downstream service from consuming all available resources. Without it, every incoming request would attempt to connect to the unhealthy service, accumulate timeouts, and eventually exhaust the Bun server's concurrency.

## The pattern

A circuit breaker is an electrical metaphor. In normal operation the circuit is **closed** and current flows. When too many failures accumulate, the circuit **opens** and blocks all current. After a fixed cooldown, the circuit moves to **half-open** and allows a single probe request through. If that probe succeeds, the circuit closes again. If it fails, the circuit reopens.

## State machine

```
                     failures >= threshold
        ┌─────────────────────────────────────────┐
        │                                         ▼
   ┌────┴─────┐                             ┌──────────┐
   │  CLOSED  │ ◄── success in HALF_OPEN ── │   OPEN   │
   └──────────┘                             └────┬─────┘
                                                 │
                                    timeout elapsed
                                                 │
                                                 ▼
                                          ┌───────────┐
                                          │ HALF_OPEN │
                                          │           │
                                          │ one probe │
                                          │ allowed   │
                                          └─────┬─────┘
                                                │
                                   failure in HALF_OPEN
                                                │
                                                ▼
                                          ┌──────────┐
                                          │   OPEN   │  (reopened)
                                          └──────────┘
```

## Transition rules

| Current state | Event                           | Next state                                                                                             |
| ------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `CLOSED`      | failure count reaches threshold | `OPEN`                                                                                                 |
| `CLOSED`      | any success                     | stays `CLOSED`, failure count resets to 0                                                              |
| `OPEN`        | any request arrives             | check timestamp — if `timeout` has elapsed, move to `HALF_OPEN`; otherwise reject immediately with 503 |
| `HALF_OPEN`   | upstream returns success        | `CLOSED` (failure count reset)                                                                         |
| `HALF_OPEN`   | upstream returns failure        | `OPEN` (timestamp refreshed)                                                                           |

The timeout check happens **lazily** inside `isOpen()`. There is no background timer; the state only advances when the next request actually arrives and checks the circuit.

## Per-service instances

Two singleton circuit breakers are created at module load time — one per downstream service:

```typescript
// src/server/bff/circuitBreaker.ts

export const restApiCircuit = new CircuitBreaker('rest-api');
export const graphqlApiCircuit = new CircuitBreaker('graphql-api');
```

This means the REST API can be tripped independently of GraphQL. If only the REST API is unhealthy, browse requests (which use REST) will be short-circuited, but card detail requests (which use GraphQL) will continue normally.

## Two ways to use it

### 1. Inline — inside proxy functions

The proxy layer checks and records state manually around the raw `fetch`:

```typescript
// src/server/bff/proxy.ts  (simplified)

if (restApiCircuit.isOpen()) {
  return new Response(/* 503 */);
}

try {
  const response = await fetch(targetUrl, { ... });

  if (response.ok)           restApiCircuit.recordSuccess();
  if (response.status >= 500) restApiCircuit.recordFailure();

  return response;
} catch (error) {
  restApiCircuit.recordFailure();  // network failure counts too
  return new Response(/* 503 */);
}
```

This is used when the proxy needs fine-grained control over what constitutes a failure — in this case, only HTTP 5xx and network errors trip the breaker. A 404 from upstream is a valid response and does **not** count as a failure.

### 2. Wrapper — `withCircuitBreaker()`

For cases where you want to wrap an arbitrary async function without manually wiring the state transitions:

```typescript
// src/server/bff/circuitBreaker.ts

export async function withCircuitBreaker<T>(
  circuit: CircuitBreaker,
  fn: () => Promise<T>,
  fallback?: () => T
): Promise<T>;
```

If a `fallback` is provided, it is called when the circuit is open **or** when `fn` throws. This is useful in aggregation handlers where a missing dataset should resolve to a default value rather than propagating an error.

> **Note:** The current handlers use the typed clients directly and catch errors at the handler level rather than using `withCircuitBreaker`. The wrapper exists for cases where the fallback pattern is cleaner than a try/catch.

## What the 503 responses look like

The error shape differs by protocol so that clients can parse them without special-casing:

**REST API (JSON object):**

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "REST API is temporarily unavailable",
    "circuitState": "OPEN"
  }
}
```

**GraphQL API (errors array per spec):**

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

Both responses include a `Retry-After: 30` header matching the default circuit breaker timeout, so clients and load balancers can back off appropriately.

## Observability

Every state transition is logged with the circuit name:

```
[CircuitBreaker:rest-api] Failure threshold reached (5/5), opening circuit
[CircuitBreaker:rest-api] Transitioning to HALF_OPEN
[CircuitBreaker:rest-api] Call succeeded, closing circuit
```

The current circuit state is also stamped on every proxied response as the `X-Circuit-State` header, so it is visible in browser DevTools and any reverse proxy access logs without needing to inspect server logs.
