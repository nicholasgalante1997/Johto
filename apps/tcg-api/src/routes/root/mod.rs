use actix_web::{
    web::{self, ServiceConfig},
    HttpResponse, Responder,
};

async fn handler() -> impl Responder {
    r#"
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>
                A Purely Rust Implementation of the Pokemon TCG API
            </title>
          </head>
          <body>
            
          </body>
        </html> 
    "#
}

pub fn configure_root_route_handler(app_config: &mut ServiceConfig) {
    app_config.service(
        web::resource("")
            .route(web::get().to(handler))
            .route(web::post().to(HttpResponse::MethodNotAllowed))
            .route(web::put().to(HttpResponse::MethodNotAllowed))
            .route(web::patch().to(HttpResponse::MethodNotAllowed))
            .route(web::delete().to(HttpResponse::MethodNotAllowed)),
    );
}
