# Queries

All data access goes through a single GraphQL endpoint. The API is read-only — there are no mutations.

---

## Card Queries

### `card`

Fetch a single card by its unique ID.

```graphql
query {
  card(id: ID!): Card
}
```

Returns `null` if no card matches. Throws a `NOT_FOUND` error with extensions when the ID is valid but absent from the database.

**Example:**

```graphql
{
  card(id: "base1-1") {
    name
    supertype
    hp
    types
    rarity
    attacks {
      name
      cost
      damage
    }
    set {
      name
      series
    }
  }
}
```

---

### `cards`

Paginated card listing with optional filters. Returns a [connection](api-pagination.md) object.

```graphql
query {
  cards(
    limit: Int = 60
    offset: Int = 0
    name: String
    types: [String!]
    rarity: String
    setId: String
  ): CardConnection!
}
```

| Argument | Default | Behavior                                                       |
| -------- | ------- | -------------------------------------------------------------- |
| `limit`  | `60`    | Maximum number of cards per page                               |
| `offset` | `0`     | Cursor-based offset into the result set                        |
| `name`   | —       | Case-insensitive substring match (`LIKE %name%`)               |
| `types`  | —       | Match cards that have **any** of the provided types (OR logic) |
| `rarity` | —       | Exact match on rarity string (e.g. `"Rare Holo"`)              |
| `setId`  | —       | Restrict results to a specific set                             |

All filters combine with AND logic. Omit a filter to leave it unconstrained.

**Example — Fire cards with "Charizard" in the name:**

```graphql
{
  cards(name: "Charizard", types: ["Fire"]) {
    edges {
      node {
        id
        name
        rarity
        images {
          large
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

---

### `cardsBySet`

Fetch cards belonging to a specific set, ordered by card number.

```graphql
query {
  cardsBySet(setId: ID!, limit: Int = 60, offset: Int = 0): [Card!]!
}
```

Returns a flat array (not a connection). Use `limit` and `offset` for manual pagination if the set is large.

---

### `cardsByName`

Search for all cards whose name matches the given string (case-insensitive substring).

```graphql
query {
  cardsByName(name: String!): [Card!]!
}
```

Useful for quick name lookups without the overhead of the full connection response.

---

## Set Queries

### `set`

Fetch a single set by ID.

```graphql
query {
  set(id: ID!): Set
}
```

The `Set` type includes nested `cards` and `cardCount` fields that are resolved via dataloaders — see [Dataloaders](architecture-dataloaders.md).

**Example:**

```graphql
{
  set(id: "base1") {
    name
    series
    releaseDate
    printedTotal
    cardCount
    images {
      logo
      symbol
    }
    legalities {
      standard
      expanded
    }
  }
}
```

---

### `sets`

Paginated set listing. Returns a [connection](api-pagination.md).

```graphql
query {
  sets(limit: Int = 50, offset: Int = 0): SetConnection!
}
```

**Example:**

```graphql
{
  sets(limit: 10) {
    edges {
      node {
        id
        name
        series
        releaseDate
        cardCount
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

---

### `setsBySeries`

Return all sets that belong to a given series.

```graphql
query {
  setsBySeries(series: String!): [Set!]!
}
```

**Example:**

```graphql
{
  setsBySeries(series: "Base") {
    id
    name
    releaseDate
    printedTotal
  }
}
```

---

## User Queries

### `user`

Fetch a single user by ID.

```graphql
query {
  user(id: ID!): User
}
```

### `users`

List users with a configurable limit.

```graphql
query {
  users(limit: Int = 10): [User!]!
}
```

---

## Utility Queries

### `stats`

Aggregate statistics about the database contents.

```graphql
query {
  stats: Stats!
}
```

Returns `totalCards`, `totalSets`, and a `lastUpdated` timestamp.

### `health`

GraphQL-layer health check. Returns database connectivity status and server uptime in seconds.

```graphql
query {
  health: HealthCheck!
}
```

> For orchestration probes (Kubernetes, Docker), prefer the dedicated [REST health endpoints](health-checks.md).
