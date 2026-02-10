# Dataloaders

The API uses [DataLoader](https://github.com/graphql/dataloader) to batch and deduplicate database queries that arise from resolving nested fields. Without dataloaders, fetching 50 sets and requesting `cardCount` on each would execute 50 separate `COUNT` queries. With dataloaders, those collapse into a single batched SQL statement.

---

## How Batching Works

DataLoader operates on a per-request tick. When multiple field resolvers request data within the same event-loop tick, DataLoader collects all the keys and issues one batched query.

**Without batching (N+1 problem):**

```
SELECT * FROM pokemon_card_sets WHERE id = 'base1'
SELECT COUNT(*) FROM pokemon_cards WHERE set_id = 'base1'
SELECT COUNT(*) FROM pokemon_cards WHERE set_id = 'base2'
SELECT COUNT(*) FROM pokemon_cards WHERE set_id = 'base3'
...
```

**With batching:**

```sql
SELECT * FROM pokemon_card_sets WHERE id IN ('base1', 'base2', 'base3', ...)
SELECT set_id, COUNT(*) FROM pokemon_cards
  WHERE set_id IN ('base1', 'base2', 'base3', ...)
  GROUP BY set_id
```

---

## Request Scoping

Dataloaders are **created fresh for every incoming request**. This prevents cached results from one user's query from leaking into another user's response. The loaders are passed through the Apollo resolver context.

---

## Available Loaders

### `setLoader`

Batch-loads sets by their IDs.

- **Batched query:** `SELECT * FROM pokemon_card_sets WHERE id IN (...)`
- **Used by:** `Card.set` field resolver
- **Deduplication:** If the same set ID is requested multiple times in one query (e.g., 10 cards all from `base1`), only one row fetch is performed.

### `cardLoader`

Batch-loads individual cards by their IDs.

- **Batched query:** `SELECT * FROM pokemon_cards WHERE id IN (...)`
- **Used by:** Direct card lookups within nested resolvers

### `cardCountBySetLoader`

Batch-loads card counts grouped by set ID.

- **Batched query:** `SELECT set_id, COUNT(*) as count FROM pokemon_cards WHERE set_id IN (...) GROUP BY set_id`
- **Used by:** `Set.cardCount` field resolver

### `cardsBySetLoader`

Batch-loads all cards for multiple sets in a single query, then groups them client-side by set ID.

- **Batched query:** `SELECT * FROM pokemon_cards WHERE set_id IN (...) ORDER BY set_id, CAST(number AS INTEGER) ASC`
- **Used by:** `Set.cards` field resolver
- **Note:** Results are ordered by collector number within each set.

---

## When Batching Fires

Consider this query:

```graphql
{
  sets(limit: 50) {
    edges {
      node {
        id
        name
        cardCount # triggers cardCountBySetLoader
        cards(limit: 5) {
          # triggers cardsBySetLoader
          name
          set {
            name
          } # triggers setLoader (deduplicated — already loaded)
        }
      }
    }
  }
}
```

Execution order:

1. The `sets` query runs and returns 50 set rows.
2. All 50 `cardCount` resolvers fire in the same tick → **one** batched COUNT query.
3. All 50 `cards` resolvers fire in the same tick → **one** batched cards query.
4. The nested `set` resolvers on each card reference sets already in the `setLoader` cache → **zero** additional queries.

Total database round-trips: **3**, regardless of how many sets are on the page.
