pub mod neo4j;
pub mod postgres;
pub mod traits;

use anyhow::Result;

use crate::database::traits::DatabaseConnection;

pub async fn connect_to_databases() -> Result<(neo4j::Neo4jGraph, postgres::PostgresPool)> {
    let n4jgraph = neo4j::Neo4jConnection::new().connect().await?;
    let pgpool = postgres::PostgresConnection::new().connect().await?;
    Ok((n4jgraph, pgpool))
}