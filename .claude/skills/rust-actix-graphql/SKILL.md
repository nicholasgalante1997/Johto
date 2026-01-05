---
name: rust-actix-graphql
description: Rust patterns with Actix-web, async-graphql, PostgreSQL, and Neo4j for high-performance Pokemon TCG API.
tags:
  - rust
  - actix-web
  - graphql
  - postgresql
  - neo4j
---

# Rust + Actix-web + GraphQL Patterns

## Purpose

Define patterns for building high-performance GraphQL APIs with Rust, Actix-web, PostgreSQL, and Neo4j for Pokemon TCG platform.

## Priority

**High**

## Core Patterns

### Project Structure

**ALWAYS** organize code by feature (ID: FEATURE_STRUCTURE)

```
src/
├── main.rs              # Entry point
├── state/               # Application state
│   └── mod.rs
├── routes/              # HTTP routes
│   ├── mod.rs
│   ├── api/
│   └── health_check/
├── database/
│   ├── mod.rs
│   ├── postgres/        # PostgreSQL operations
│   │   ├── mod.rs
│   │   └── models/
│   ├── neo4j/           # Neo4j operations
│   └── traits/          # Database traits
└── utils/               # Utilities
    ├── mod.rs
    ├── log/
    └── json/
```

### GraphQL Schema Definition

**ALWAYS** use async-graphql macros (ID: GRAPHQL_MACROS)

```rust
use async_graphql::{Object, Context, Result};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get a Pokemon card by ID
    async fn card(&self, ctx: &Context<'_>, id: String) -> Result<PokemonCard> {
        let pool = ctx.data::<PgPool>()?;
        Ok(PokemonCard::find_by_id(pool, &id).await?)
    }

    /// Search Pokemon cards with filters
    async fn search_cards(
        &self,
        ctx: &Context<'_>,
        name: Option<String>,
        types: Option<Vec<String>>,
        set_id: Option<String>,
    ) -> Result<Vec<PokemonCard>> {
        let pool = ctx.data::<PgPool>()?;
        Ok(search_pokemon_cards(pool, name, types, set_id).await?)
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Add a card to user's collection
    async fn add_to_collection(
        &self,
        ctx: &Context<'_>,
        user_id: String,
        card_id: String,
    ) -> Result<bool> {
        let pool = ctx.data::<PgPool>()?;
        add_card_to_collection(pool, &user_id, &card_id).await?;
        Ok(true)
    }
}
```

### Database Models

**ALWAYS** derive serde and sqlx traits (ID: DERIVE_TRAITS)

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use async_graphql::SimpleObject;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct PokemonCard {
    pub id: String,
    pub name: String,
    pub hp: Option<String>,
    pub types: Option<Vec<String>>,
    pub set_id: String,
    pub number: String,
    pub rarity: Option<String>,
    pub image_url: Option<String>,
}
```

### PostgreSQL Queries

**ALWAYS** use sqlx with compile-time verification (ID: SQLX_COMPILE_TIME)

```rust
use sqlx::{PgPool, query_as};

impl PokemonCard {
    pub async fn find_by_id(pool: &PgPool, id: &str) -> Result<Self> {
        let card = query_as::<_, PokemonCard>(
            "SELECT * FROM pokemon_cards WHERE id = $1"
        )
        .bind(id)
        .fetch_one(pool)
        .await?;

        Ok(card)
    }

    pub async fn find_by_set(pool: &PgPool, set_id: &str) -> Result<Vec<Self>> {
        let cards = query_as::<_, PokemonCard>(
            "SELECT * FROM pokemon_cards WHERE set_id = $1 ORDER BY number"
        )
        .bind(set_id)
        .fetch_all(pool)
        .await?;

        Ok(cards)
    }
}
```

**ALWAYS** use transactions for multi-step operations (ID: USE_TRANSACTIONS)

```rust
pub async fn create_collection_with_cards(
    pool: &PgPool,
    user_id: &str,
    collection_name: &str,
    card_ids: &[String],
) -> Result<String> {
    let mut tx = pool.begin().await?;

    // Create collection
    let collection_id = sqlx::query_scalar::<_, String>(
        "INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING id"
    )
    .bind(user_id)
    .bind(collection_name)
    .fetch_one(&mut *tx)
    .await?;

    // Add cards to collection
    for card_id in card_ids {
        sqlx::query(
            "INSERT INTO collection_cards (collection_id, card_id) VALUES ($1, $2)"
        )
        .bind(&collection_id)
        .bind(card_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(collection_id)
}
```

### Neo4j Queries

**ALWAYS** use parameterized Cypher queries (ID: NEO4J_PARAMS)

```rust
use neo4rs::{Graph, query};

pub async fn get_evolution_chain(
    graph: &Graph,
    card_name: &str,
) -> Result<Vec<String>> {
    let mut result = graph.execute(
        query(
            "MATCH (c:Card {name: $name})-[:EVOLVES_TO*]->(e:Card)
             RETURN e.name as name
             ORDER BY e.name"
        )
        .param("name", card_name)
    ).await?;

    let mut evolutions = Vec::new();
    while let Some(row) = result.next().await? {
        let name: String = row.get("name")?;
        evolutions.push(name);
    }

    Ok(evolutions)
}

pub async fn find_card_synergies(
    graph: &Graph,
    card_id: &str,
    limit: i64,
) -> Result<Vec<CardSynergy>> {
    let mut result = graph.execute(
        query(
            "MATCH (c:Card {id: $id})-[r:SYNERGIZES_WITH]-(s:Card)
             RETURN s.id as id, s.name as name, r.strength as strength
             ORDER BY r.strength DESC
             LIMIT $limit"
        )
        .param("id", card_id)
        .param("limit", limit)
    ).await?;

    let mut synergies = Vec::new();
    while let Some(row) = result.next().await? {
        synergies.push(CardSynergy {
            id: row.get("id")?,
            name: row.get("name")?,
            strength: row.get("strength")?,
        });
    }

    Ok(synergies)
}
```

### Error Handling

**ALWAYS** use anyhow::Result for error propagation (ID: ANYHOW_RESULT)

```rust
use anyhow::{Context, Result};

pub async fn get_card_with_context(
    pool: &PgPool,
    id: &str,
) -> Result<PokemonCard> {
    PokemonCard::find_by_id(pool, id)
        .await
        .context(format!("Failed to fetch card with id: {}", id))
}
```

**ALWAYS** create custom error types for domain errors (ID: CUSTOM_ERRORS)

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Card not found: {0}")]
    CardNotFound(String),

    #[error("Invalid card data: {0}")]
    InvalidCard(String),

    #[error("Collection not found: {0}")]
    CollectionNotFound(String),
}
```

### Async Patterns

**ALWAYS** use tokio::try_join for concurrent operations (ID: CONCURRENT_OPS)

```rust
use tokio::try_join;

pub async fn fetch_card_details(
    pool: &PgPool,
    graph: &Graph,
    card_id: &str,
) -> Result<CardDetails> {
    let (card, evolutions, synergies) = try_join!(
        PokemonCard::find_by_id(pool, card_id),
        get_evolution_chain(graph, card_id),
        find_card_synergies(graph, card_id, 10),
    )?;

    Ok(CardDetails {
        card,
        evolutions,
        synergies,
    })
}
```

### Application State

**ALWAYS** use Actix-web's Data for shared state (ID: ACTIX_DATA)

```rust
use actix_web::{web, App, HttpServer};
use sqlx::PgPool;
use neo4rs::Graph;

pub struct AppState {
    pub pg_pool: PgPool,
    pub neo4j_graph: Graph,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pg_pool = PgPool::connect(&db_url).await.unwrap();
    let neo4j_graph = Graph::new(&neo4j_uri, &user, &pass).await.unwrap();

    let state = web::Data::new(AppState {
        pg_pool,
        neo4j_graph,
    });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .route("/graphql", web::post().to(graphql_handler))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
```

### Middleware

**ALWAYS** configure CORS for web access (ID: CORS_CONFIG)

```rust
use actix_cors::Cors;
use actix_web::{http, middleware::Logger};

HttpServer::new(move || {
    let cors = Cors::default()
        .allowed_origin("http://localhost:3000")
        .allowed_methods(vec!["GET", "POST"])
        .allowed_headers(vec![http::header::AUTHORIZATION, http::header::CONTENT_TYPE])
        .max_age(3600);

    App::new()
        .wrap(cors)
        .wrap(Logger::default())
        .app_data(state.clone())
        .configure(configure_routes)
})
```

## Testing Patterns

**ALWAYS** write unit tests for database operations (ID: DB_TESTS)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[tokio::test]
    async fn test_find_card_by_id() {
        let pool = create_test_pool().await;

        let card = PokemonCard::find_by_id(&pool, "base1-4")
            .await
            .expect("Failed to fetch Charizard");

        assert_eq!(card.name, "Charizard");
        assert_eq!(card.set_id, "base1");
    }

    #[tokio::test]
    async fn test_card_not_found() {
        let pool = create_test_pool().await;

        let result = PokemonCard::find_by_id(&pool, "invalid-id").await;

        assert!(result.is_err());
    }
}
```

### Integration Tests

**ALWAYS** test GraphQL queries end-to-end (ID: GRAPHQL_TESTS)

```rust
#[tokio::test]
async fn test_graphql_card_query() {
    let schema = create_test_schema().await;

    let query = r#"
        query {
            card(id: "base1-4") {
                id
                name
                hp
            }
        }
    "#;

    let result = schema.execute(query).await;

    assert!(result.errors.is_empty());
    let data = result.data.into_json().unwrap();
    assert_eq!(data["card"]["name"], "Charizard");
}
```

## Pokemon TCG Specific

### Card Validation

**ALWAYS** validate card data before insertion (ID: VALIDATE_CARDS)

```rust
impl PokemonCard {
    pub fn validate(&self) -> Result<()> {
        if self.name.is_empty() {
            return Err(anyhow!("Card name cannot be empty"));
        }

        if self.id.is_empty() {
            return Err(anyhow!("Card ID cannot be empty"));
        }

        if let Some(hp) = &self.hp {
            let hp_val: i32 = hp.parse()
                .context("HP must be a valid number")?;
            if hp_val <= 0 || hp_val > 500 {
                return Err(anyhow!("HP must be between 1 and 500"));
            }
        }

        Ok(())
    }
}
```

### Deck Validation

**ALWAYS** enforce Pokemon TCG deck rules (ID: DECK_RULES)

```rust
pub fn validate_deck(cards: &[PokemonCard]) -> Result<()> {
    if cards.len() != 60 {
        return Err(anyhow!("Deck must contain exactly 60 cards"));
    }

    let mut card_counts = std::collections::HashMap::new();
    for card in cards {
        *card_counts.entry(&card.name).or_insert(0) += 1;
    }

    for (name, count) in card_counts {
        // Basic Energy cards can have unlimited copies
        if !name.ends_with("Energy") && count > 4 {
            return Err(anyhow!(
                "Cannot have more than 4 copies of '{}' in a deck",
                name
            ));
        }
    }

    Ok(())
}
```

## Performance Optimization

**ALWAYS** use connection pooling (ID: CONNECTION_POOL)

**ALWAYS** add database indexes for common queries (ID: DB_INDEXES)

```sql
CREATE INDEX idx_cards_name ON pokemon_cards(name);
CREATE INDEX idx_cards_set_id ON pokemon_cards(set_id);
CREATE INDEX idx_cards_types ON pokemon_cards USING GIN(types);
```

**ALWAYS** limit query results (ID: LIMIT_QUERIES)

```rust
pub async fn search_cards(
    pool: &PgPool,
    name: &str,
    limit: i32,
) -> Result<Vec<PokemonCard>> {
    let limit = limit.min(100); // Cap at 100

    let cards = query_as::<_, PokemonCard>(
        "SELECT * FROM pokemon_cards WHERE name ILIKE $1 LIMIT $2"
    )
    .bind(format!("%{}%", name))
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(cards)
}
```

## Common Mistakes to Avoid

- Not using transactions for multi-step database operations
- Forgetting to parameterize SQL/Cypher queries (SQL injection risk)
- Not handling database connection errors
- Not limiting query results
- Using unwrap() in production code
- Not validating user input
- Blocking the async runtime with synchronous operations

## Build Commands

```bash
# Development
cargo run                  # Run API server
cargo watch -x run         # Auto-reload

# Database
sqlx migrate run           # Run migrations
sqlx migrate revert        # Revert migration

# Testing
cargo test                 # All tests
cargo test --lib           # Library tests

# Production
cargo build --release      # Optimized build
cargo clippy               # Linting
cargo fmt                  # Format code
```
