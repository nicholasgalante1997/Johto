use anyhow::{Context, Result};
use neo4rs::Graph;

use std::env;

pub type Neo4jGraph = neo4rs::Graph;

pub struct Neo4jConnection;

impl Neo4jConnection {
    
    /// Creates a new instance of `Neo4jConnection`.
    pub fn new() -> Self {
        Neo4jConnection
    }

    /// Establishes a connection to the Neo4j graph database using the
    /// NEO4J_URL, NEO4J_USER, and NEO4J_SECRET environment variables.
    ///
    /// #### Errors
    ///
    /// Returns an error if any of the required environment variables are not
    /// set, or if the connection to the database could not be established.
    pub async fn connect(&self) -> Result<Neo4jGraph> {
        let uri = env::var("NEO4J_URL").context("NEO4J_URL must be set")?;
        let user = env::var("NEO4J_USER").context("NEO4J_USER must be set")?;
        let password = env::var("NEO4J_SECRET").context("NEO4J_SECRET must be set")?;

        Graph::new(uri, user, password).await.map_err(anyhow::Error::from)
    }
}