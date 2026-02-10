# What is the BFF layer?

The web app (`apps/web`) does not talk to the Rust microservices directly from the browser. A **Backend-for-Frontend (BFF)** layer sits inside the same Bun server process and acts as the single origin for all API traffic. It serves two distinct roles depending on the URL prefix the request arrives on.

## The two modes

<div class="feature-grid">
  <div class="feature-card">
    <h4>Aggregation (`/bff/*`)</h4>
    <p>Page-level endpoints that fetch from one or more downstream services, reshape the data for exactly what a view needs, and return a single JSON response. Errors on individual sub-fetches are tolerated.</p>
  </div>
  <div class="feature-card">
    <h4>Proxy (`/api/v1/*`, `/graphql`)</h4>
    <p>Transparent passthrough for client-side fetching after hydration. The request is forwarded as-is to the correct microservice; the only added behaviour is circuit breaker bookkeeping.</p>
  </div>
</div>

Both modes share the same [circuit breaker](circuit-breaker.md) infrastructure to prevent cascading failures when a downstream service is unhealthy.

## Why BFF?

The alternative — having the browser fetch directly from multiple microservices — creates several problems in a server-rendered app:

| Problem                        | How the BFF solves it                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Origin fragmentation**       | The browser only ever talks to `localhost:3000`. Downstream URLs are internal and never exposed.                                                                                            |
| **Over-fetching on page load** | SSR needs a single response to render a page. The BFF aggregates multiple service calls server-side and returns only what the template requires.                                            |
| **Partial failure handling**   | A failing "related cards" fetch should not prevent the card detail page from rendering. Aggregation handlers catch sub-errors individually and return partial data with warnings.           |
| **Cascading failure risk**     | If the REST API is down, the BFF should stop hammering it immediately rather than queuing requests. The circuit breaker enforces this.                                                      |
| **Protocol mismatch**          | The browse page needs paginated lists (REST), the card detail page needs deep nested graph data (GraphQL). The BFF picks the right client for each need — the browser doesn't have to know. |

## How the pieces fit together

The full request lifecycle is documented in [Architecture & data flow](architecture.md). The short version:

1. `server.ts` receives every request on port 3000.
2. If the path starts with `/bff/`, it is routed to a **handler** that aggregates data.
3. If the path starts with `/api/v1/` or `/graphql`, it is **proxied** directly to the matching microservice.
4. Everything else falls through to the SSR page renderer.

All outbound calls to downstream services pass through a **circuit breaker** that tracks failures per service. When a service trips the threshold, all subsequent calls are short-circuited with a 503 until the cooldown period elapses and a single probe request is allowed through.
