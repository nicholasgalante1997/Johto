use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, types::Json, FromRow, PgPool, Row};

#[derive(Debug, Deserialize, Serialize)]
struct PokemonCardSetImages {
    logo: String,
    symbol: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PokemonCardSet {
    id: String,
    name: String,
    series: String,
    printed_total: i16,
    total: i16,
    images: Json<PokemonCardSetImages>,
    release_date: String,
    updated_at: String,
}

impl FromRow<'_, PgRow> for PokemonCardSet {
    fn from_row(row: &PgRow) -> Result<Self, sqlx::Error> {
        Ok(PokemonCardSet {
            id: row.get("id"),
            name: row.get("name"),
            series: row.get("series"),
            printed_total: row.get("printed_total"),
            total: row.get("total"),
            images: row.get("images"),
            release_date: row.get("release_date"),
            updated_at: row.get("updated_at"),
        })
    }
}

pub struct PokemonCardSetsORM<'a> {
    pool: &'a PgPool
}

impl<'a> PokemonCardSetsORM<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        PokemonCardSetsORM { pool }
    }

    pub async fn get_all_sets(&self) -> Result<Vec<PokemonCardSet>> {
        let sets = sqlx::query_as::<_, PokemonCardSet>("SELECT * FROM pokemon_card_sets")
            .fetch_all(self.pool)
            .await?;
        Ok(sets)
    }

    pub async fn get_set_by_id(&self, id: &str) -> Result<PokemonCardSet> {
        let set = sqlx::query_as::<_, PokemonCardSet>("SELECT * FROM pokemon_card_sets WHERE id = $1")
            .bind(id)
            .fetch_one(self.pool)
            .await?;
        Ok(set)
    }
}