use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, types::Json, FromRow, PgPool, Row};

#[derive(Debug, Deserialize, Serialize)]
pub struct Legalities {
    unlimited: String,
    expanded: String,
    standard: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CardImages {
    small: String,
    large: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Weakness {
    #[serde(rename = "type")]
    weakness_type: String,
    value: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Attack {
    name: String,
    cost: Vec<String>,
    text: String,
    damage: String,
    converted_energy_cost: i8
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Ability {
    name: String,
    text: String,
    #[serde(rename = "type")]
    ability_type: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PokemonCard {
    id: String,
    name: String,
    supertype: String,
    subtypes: Vec<String>,
    hp: i16,
    types: Vec<String>,
    evolves_from: Option<Vec<String>>,
    evolves_to: Option<Vec<String>>,
    rules: Option<Vec<String>>,
    abilities: Option<Json<Vec<Ability>>>,
    attacks: Option<Json<Vec<Attack>>>,
    weaknesses: Option<Json<Vec<Weakness>>>,
    retreat_cost: Option<Vec<String>>,
    converted_retreat_cost: Option<i8>,
    set_id: String,
    number: String,
    artist: Option<String>,
    rarity: Option<String>,
    flavor_text: Option<String>,
    national_pokedex_numbers: Option<Vec<i32>>,
    legalities: Option<Json<Legalities>>,
    images: Option<Json<CardImages>>,
    tcgplayer_url: Option<String>,
    updated_at: String
}

impl FromRow<'_, PgRow> for PokemonCard {
    fn from_row(row: &PgRow) -> Result<Self, sqlx::Error> {
        Ok(PokemonCard {
            id: row.get("id"),
            name: row.get("name"),
            supertype: row.get("supertype"),
            subtypes: row.get("subtypes"),
            hp: row.get("hp"),
            types: row.get("types"),
            evolves_from: row.get("evolves_from"),
            evolves_to: row.get("evolves_to"),
            rules: row.get("rules"),
            abilities: row.get("abilities"),
            attacks: row.get("attacks"),
            weaknesses: row.get("weaknesses"),
            retreat_cost: row.get("retreat_cost"),
            converted_retreat_cost: row.get("converted_retreat_cost"),
            set_id: row.get("set_id"),
            number: row.get("number"),
            artist: row.get("artist"),
            rarity: row.get("rarity"),
            flavor_text: row.get("flavor_text"),
            national_pokedex_numbers: row.get("national_pokedex_numbers"),
            legalities: row.get("legalities"),
            images: row.get("images"),
            tcgplayer_url: row.get("tcgplayer_url"),
            updated_at: row.get("updated_at"),
        })
    }
}

pub struct PokemonCardORM<'a> {
    pool: &'a PgPool
}

impl<'a> PokemonCardORM<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        PokemonCardORM { pool }
    }

    pub async fn get_all_cards(&self) -> Result<Vec<PokemonCard>> {
        let cards = sqlx::query_as::<_, PokemonCard>("SELECT * FROM pokemon_cards")
            .fetch_all(self.pool)
            .await?;
        Ok(cards)
    }

    pub async fn get_all_cards_in_set(&self, set_id: &str) -> Result<Vec<PokemonCard>> {
        let cards = sqlx::query_as::<_, PokemonCard>("SELECT * FROM pokemon_cards WHERE set_id = $1")
            .bind(set_id)
            .fetch_all(self.pool)
            .await?;
        Ok(cards)
    }

    pub async fn get_card_by_id(&self, id: &str) -> Result<PokemonCard> {
        let card = sqlx::query_as::<_, PokemonCard>("SELECT * FROM pokemon_cards WHERE id = $1")
            .bind(id)
            .fetch_one(self.pool)
            .await?;
        Ok(card)
    }
}