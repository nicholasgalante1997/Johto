pub mod models;

use anyhow::{Context, Result};
use sqlx::postgres::PgPoolOptions;
use std::env;

use crate::database::traits::DatabaseConnection;
use crate::utils::log::get_logger;

pub type PostgresPool = sqlx::PgPool;

pub struct PostgresConnection;

impl DatabaseConnection<PostgresPool> for PostgresConnection {
    async fn connect(&self) -> Result<PostgresPool> {
        establish_connection_to_pg_database().await
    }

    fn new() -> Self {
        PostgresConnection
    }
}

/// Establishes a connection to the PostgreSQL database using the DATABASE_URL
/// environment variable. Returns a `sqlx::PgPool` representing the connection pool.
///
/// #### Errors
///
/// Returns an error if the DATABASE_URL is not set or if the connection cannot be established.
async fn establish_connection_to_pg_database() -> Result<sqlx::PgPool> {
    let mut db_connection_logger = get_logger(Some("db_connection"));
    db_connection_logger.write("Connecting to database...".to_string());
    let database_url = env::var("PG_DATABASE_URL").expect("PG_DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .idle_timeout(std::time::Duration::from_secs(300))
        .connect(&database_url)
        .await
        .context(r#"
            mod `database` fn `establish_connection_to_pg_database` produced a non-recoverable error.
            env `DATABASE_URL` is available, but the database has refused the connection.
            please check your database configuration options.
            Closing!
            "#)?;

    db_connection_logger.write("Connected to database!".to_string());
    Ok(pool)
}