use actix_web::{get, Responder};

#[get("/health")]
pub async fn health_check_route_handler() -> impl Responder {
    "OK"
}

