# Database

The API reads from a SQLite database file. SQLite was chosen for its zero-configuration deployment model — no separate database server process is needed, and the entire dataset ships as a single portable file.

---

## Database File

```
apps/graphql-api/database/pokemon-data.sqlite3.db
```

The file is approximately 18 MB and contains the full Pokemon TCG card catalog. In Docker deployments it is mounted as a **read-only volume** from the monorepo's shared `database/` directory.

---

## Read-Only Mode

The `DATABASE_READONLY` environment variable (default `true`) sets SQLite's `PRAGMA query_only` flag. This prevents any accidental writes through the API and provides a minor performance benefit by allowing SQLite to skip journal management.

---

## Tables

### `pokemon_card_sets`

Stores metadata for each Pokemon TCG expansion set.

| Column          | Type    | Notes                                            |
| --------------- | ------- | ------------------------------------------------ |
| `id`            | TEXT    | Primary key (e.g. `"base1"`)                     |
| `name`          | TEXT    | Set display name                                 |
| `series`        | TEXT    | Series grouping (e.g. `"Base"`)                  |
| `printed_total` | INTEGER | Cards in the printed set                         |
| `total`         | INTEGER | Total including secret rares                     |
| `release_date`  | TEXT    | ISO date string                                  |
| `ptcgo_code`    | TEXT    | PTCGO set identifier                             |
| `images`        | TEXT    | JSON object: `{ symbol, logo }`                  |
| `legalities`    | TEXT    | JSON object: `{ unlimited, standard, expanded }` |
| `created_at`    | TEXT    | ISO timestamp                                    |
| `updated_at`    | TEXT    | ISO timestamp                                    |

### `pokemon_cards`

Stores every individual card in the catalog.

| Column                     | Type    | Notes                                   |
| -------------------------- | ------- | --------------------------------------- |
| `id`                       | TEXT    | Primary key (e.g. `"base1-1"`)          |
| `name`                     | TEXT    | Card name                               |
| `supertype`                | TEXT    | `"Pokémon"`, `"Trainer"`, or `"Energy"` |
| `subtypes`                 | TEXT    | JSON array of strings                   |
| `hp`                       | INTEGER | Hit points (null for non-Pokémon)       |
| `types`                    | TEXT    | JSON array of energy type strings       |
| `evolves_from`             | TEXT    | Name of pre-evolution                   |
| `evolves_to`               | TEXT    | JSON array of evolution names           |
| `rules`                    | TEXT    | JSON array of rule-box lines            |
| `abilities`                | TEXT    | JSON array of ability objects           |
| `attacks`                  | TEXT    | JSON array of attack objects            |
| `weaknesses`               | TEXT    | JSON array: `[{ type, value }]`         |
| `resistances`              | TEXT    | JSON array: `[{ type, value }]`         |
| `retreat_cost`             | TEXT    | JSON array of energy symbol strings     |
| `converted_retreat_cost`   | INTEGER | Numeric retreat cost                    |
| `set_id`                   | TEXT    | Foreign key → `pokemon_card_sets.id`    |
| `number`                   | TEXT    | Collector number within the set         |
| `artist`                   | TEXT    | Card artist                             |
| `rarity`                   | TEXT    | Rarity label                            |
| `flavor_text`              | TEXT    | Flavor text                             |
| `national_pokedex_numbers` | TEXT    | JSON array of integers                  |
| `legalities`               | TEXT    | JSON object                             |
| `images`                   | TEXT    | JSON object: `{ small, large }`         |
| `tcgplayer_url`            | TEXT    | TCGPlayer URL                           |
| `cardmarket_url`           | TEXT    | Cardmarket URL                          |
| `created_at`               | TEXT    | ISO timestamp                           |
| `updated_at`               | TEXT    | ISO timestamp                           |

### `users`

Platform user accounts.

| Column       | Type | Notes         |
| ------------ | ---- | ------------- |
| `id`         | TEXT | Primary key   |
| `username`   | TEXT | Display name  |
| `email`      | TEXT | Email address |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

---

## JSON Columns

Several columns store structured data as JSON strings. The `formatCard` and `formatSet` utilities in `src/utils/formatters.ts` parse these into typed objects before they reach the GraphQL resolvers. This keeps the SQLite schema flat while still supporting rich nested types in the GraphQL response.

---

## DatabaseService

The `DatabaseService` class (`src/services/database.ts`) wraps Bun's native SQLite bindings. It implements a `Service` interface from the shared `@pokemon/framework` package, exposing `start()` and `stop()` lifecycle hooks so the application container can manage the connection.

Key methods:

| Method                        | Returns     | Description                           |
| ----------------------------- | ----------- | ------------------------------------- |
| `query<T>(sql, ...params)`    | `T[]`       | Execute a query, return all rows      |
| `queryOne<T>(sql, ...params)` | `T \| null` | Execute a query, return the first row |
| `ping()`                      | `boolean`   | Health-check the database connection  |
