# Pagination

The `cards` and `sets` queries return **Relay-style connection** objects. This pattern gives clients a stable, cursor-based way to walk through large result sets without skipping or duplicating records as the underlying data changes.

---

## Connection Structure

Every paginated query returns a connection with three top-level fields:

```graphql
type CardConnection {
  edges: [CardEdge!]! # The current page of results
  pageInfo: PageInfo! # Metadata for navigating to the next/previous page
  totalCount: Int! # Total number of matching records (ignoring limit/offset)
}

type CardEdge {
  node: Card! # The actual card data
  cursor: String! # An opaque cursor pointing to this item's position
}
```

`SetConnection` follows the same shape with `SetEdge` containing a `Set` node.

---

## PageInfo

```graphql
type PageInfo {
  hasNextPage: Boolean! # true if there are more results after this page
  hasPreviousPage: Boolean! # true if there are results before this page
  startCursor: String # Cursor of the first edge on this page
  endCursor: String # Cursor of the last edge on this page
}
```

---

## How Cursors Work

Cursors are **base64-encoded offsets**. The encoding is:

```
cursor = base64("cursor:" + offset)
```

They are opaque to the client — treat them as uninterpretable tokens and pass them back to the API as-is.

---

## Fetching Pages

### First page

Omit `offset` or pass `0`. Use `limit` to control page size.

```graphql
{
  cards(limit: 20) {
    edges {
      node {
        id
        name
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

### Next page

Check `pageInfo.hasNextPage`. If `true`, pass the `endCursor` value as the `offset` for the next request.

```graphql
{
  cards(limit: 20, offset: "Y3Vyc29yOjIw") {
    edges {
      node {
        id
        name
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Combining with filters

Pagination and filters compose freely. The `totalCount` reflects the filtered result set, not the entire table.

```graphql
{
  cards(limit: 10, types: ["Water"], rarity: "Rare Holo") {
    edges {
      node {
        id
        name
        rarity
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

## Choosing `limit` Values

| Use Case           | Recommended `limit`     |
| ------------------ | ----------------------- |
| Mobile list view   | `20`                    |
| Desktop grid       | `60` (default)          |
| Bulk data export   | `200`+                  |
| Single-item lookup | Use `card(id:)` instead |

There is no server-enforced maximum, but very large limits will increase memory usage and query time proportionally.
