use std::sync::Mutex;
use crate::database::{postgres, neo4j};

pub struct AppState {
    pub neo4j: Mutex<neo4j::Neo4jGraph>,
    pub postgres: Mutex<postgres::PostgresPool>
}

impl AppState {
    pub fn new(neo4j: neo4j::Neo4jGraph, postgres: postgres::PostgresPool) -> Self {
        Self {
            neo4j: Mutex::new(neo4j),
            postgres: Mutex::new(postgres)
        }
    }
}