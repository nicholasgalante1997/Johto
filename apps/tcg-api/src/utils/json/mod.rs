use actix_web::{body::BoxBody, http::header::ContentType, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json;

/// Converts a serializable object into a JSON response body.
///
/// #### Errors
///
/// * Will panic if `body` cannot be serialized into JSON.
pub fn convert_to_json_body<'a, T>(body: &'a T) -> HttpResponse<BoxBody>
where
    T: Serialize + Deserialize<'a>,
{
    let body = serde_json::to_string(&body).unwrap();

    // Create response and set content type
    HttpResponse::Ok()
        .content_type(ContentType::json())
        .body(body)
}