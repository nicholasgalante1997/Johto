use actix_cors::Cors;
use actix_web::http;

pub fn get_cors_middleware() -> Cors {
    Cors::default()
        .allow_any_origin() // Temporarily allow any origin -> .allowed_origin("http://example.com") // Allow only this origin
        .allowed_methods(vec!["GET", "OPTIONS"])
        .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
        .allowed_header(http::header::CONTENT_TYPE)
        .max_age(3600)
}
