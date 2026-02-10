use actix_web::middleware::{self, DefaultHeaders};

pub fn add_middleware_headers() -> DefaultHeaders {
    middleware::DefaultHeaders::new()
        .add(("X-API-Version", "0.2"))
        .add(("X-API-Service-Name", "feraligatr___0.2-alpha___tcg-api"))
        .add(("X-Content-Type-Options",  "nosniff"))
        .add(("X-Frame-Options", "DENY"))
}