# Pokemon GraphQL API

> A high-performance Pokemon TCG GraphQL API built with Apollo Server 4 and Bun.

The GraphQL API is the primary data layer for the Pokemon TCG platform. It exposes the full card catalog — sets, individual cards, and users — through a single typed endpoint with cursor-based pagination and automatic query batching.

## What's Included

<div class="feature-grid">
  <div class="feature-card">
    <h4>Card Catalog</h4>
    <p>Query the full TCG card database with filtering by name, type, rarity, and set.</p>
  </div>
  <div class="feature-card">
    <h4>Set Browsing</h4>
    <p>Browse sets by series with nested card access and card counts.</p>
  </div>
  <div class="feature-card">
    <h4>Cursor Pagination</h4>
    <p>Relay-style connections on cards and sets for efficient infinite scrolling.</p>
  </div>
  <div class="feature-card">
    <h4>Dataloader Batching</h4>
    <p>Request-scoped batching eliminates N+1 queries on nested field resolvers.</p>
  </div>
</div>

## Endpoints at a Glance

| Endpoint    | Method    | Purpose                 |
| ----------- | --------- | ----------------------- |
| `/graphql`  | GET, POST | Main GraphQL endpoint   |
| `/graphiql` | GET       | Interactive GraphQL IDE |
| `/health`   | GET       | Liveness probe          |
| `/ready`    | GET       | Readiness probe         |

## Quick Query

```graphql
{
  cards(limit: 5, types: ["Fire"]) {
    edges {
      node {
        id
        name
        rarity
        set {
          name
          series
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

New here? Start with the [Quick Start Guide](quickstart.md) to get the API running locally.
