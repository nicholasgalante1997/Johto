use anyhow::Result;

pub trait DatabaseConnection<PoolType> {
    async fn connect(&self) -> Result<PoolType>;
    fn new() -> Self;
}