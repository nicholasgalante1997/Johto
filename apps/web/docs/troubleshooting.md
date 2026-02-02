# Troubleshooting

## Circuit breaker is stuck in OPEN state

**Symptom:** All requests to a downstream service return 503 with `circuitState: "OPEN"`, and the service appears healthy when called directly.

**Cause:** The circuit breaker's timeout has not elapsed since the last failure was recorded. The default timeout is 30 seconds. During that window, no requests are allowed through — not even to check whether the service has recovered.

**Resolution:**

1. Check the server logs for the transition message:

   ```
   [CircuitBreaker:rest-api] Failure threshold reached (5/5), opening circuit
   ```

   The timestamp on this log line tells you when the circuit opened. It will transition to `HALF_OPEN` 30 seconds after that.

2. If you need it to recover faster in development, reduce `CIRCUIT_BREAKER_TIMEOUT_MS`:

   ```bash
   CIRCUIT_BREAKER_TIMEOUT_MS=5000 bun run dev
   ```

3. Once the timeout elapses, the next request will be allowed through as a probe. If the service is actually healthy, that probe will succeed and the circuit will close. If it fails again, the circuit reopens for another timeout period.

**Why there is no manual reset:** The circuit breaker has no "force close" API. This is intentional — in production you do not want operators manually overriding the breaker while the service is still unhealthy. If you need to force a reset during development, restart the Bun process (the circuit breakers are in-memory singletons and reset on startup).

---

## Stale data being returned

**Symptom:** A card detail page shows outdated information even after the upstream data has been updated.

**Cause:** The `getCardDetail` handler caches responses by card ID with a 2-minute TTL. If the upstream data changed within that window, the cached version is returned.

**Resolution:**

1. Wait for the TTL to expire (2 minutes for card detail, 5 minutes for browse filters).
2. If you need to bypass the cache immediately during development, restart the Bun process. The cache is in-memory and does not persist across restarts.
3. For longer-term data freshness, reduce the TTL constants in the handler files. Note that shorter TTLs increase the number of downstream calls the BFF makes.

**How to tell if a response came from cache:** Check the `X-Cache` response header. `HIT` means the data was served from cache; `MISS` means it was freshly fetched.

---

## Requests timing out

**Symptom:** BFF requests hang for 10 seconds and then return a timeout error.

**Cause:** The typed clients apply a 10-second timeout (`BFF_TIMEOUT_MS`) via `AbortController`. If the downstream service does not respond within that window, the request is aborted.

**Resolution:**

1. Check whether the downstream service is actually responding. Hit it directly:

   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002/graphql -d '{"query":"{ health { status } }"}'
   ```

2. If the service is responding but slowly, increase the timeout:

   ```bash
   BFF_TIMEOUT_MS=30000 bun run dev
   ```

3. If a handler makes sequential calls (e.g., `getCardDetail` fetches the card then fetches related cards), the worst-case latency is `2 × BFF_TIMEOUT_MS`. Consider whether the calls can be made concurrently instead.

**Important:** `BFF_TIMEOUT_MS` should always be less than any upstream timeout (load balancer, reverse proxy). Otherwise the client connection will be killed before the BFF has a chance to respond with its own timeout error.

---

## Health endpoint reports `degraded`

**Symptom:** `GET /bff/health` returns `status: "degraded"` with one service marked unhealthy.

**Cause:** The health handler probes both downstream services independently. `degraded` means one is healthy and the other is not.

**Resolution:**

1. Look at the `checks` object in the health response to see which service is unhealthy and what error it returned:

   ```json
   {
     "status": "degraded",
     "checks": {
       "restApi": { "status": "healthy", "latency": 12 },
       "graphqlApi": {
         "status": "unhealthy",
         "latency": 10023,
         "error": "GraphQL API timeout after 10000ms"
       }
     }
   }
   ```

2. The health check uses the same typed clients and the same timeout as regular requests. A timeout in the health check means the service is not responding within `BFF_TIMEOUT_MS`.

3. Note that the health endpoint does **not** check or update the circuit breakers. It is a read-only probe. The circuit breakers are only updated by actual proxy and client calls.

---

## 405 Method Not Allowed on `/bff/*`

**Symptom:** A POST (or other non-GET method) to a `/bff/*` route returns 405.

**Cause:** The BFF router currently only accepts GET requests. The method check happens before route matching:

```typescript
if (request.method !== 'GET') {
  return new Response(/* 405 */, { headers: { Allow: 'GET' } });
}
```

**Resolution:** If you need a non-GET BFF endpoint (e.g., a POST for submitting a trade), update the method check in `router.ts` to allow the methods your route needs. Each handler can then validate the method internally if routes on the same path support different methods.

---

## `/bff/*` route returns `null` (falls through to SSR)

**Symptom:** A request to a `/bff/*` path returns an HTML page instead of JSON.

**Cause:** `routeBffRequest()` returns `null` when no route pattern matches the requested path. The server then falls through to the SSR handler, which renders whatever page (or 404) matches.

**Resolution:**

1. Verify the route is registered in the `routes` array in `router.ts`.
2. Check the URL path exactly — trailing slashes, typos, and missing path parameters all cause the regex match to fail.
3. The router logs BFF errors with the request ID, but it does **not** log when no route matches. If you need to debug route matching, add a temporary log before the `return null` line.
