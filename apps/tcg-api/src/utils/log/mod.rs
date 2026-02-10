use debugrs;

pub fn get_logger(namespace: Option<&str>) -> debugrs::RsDebugger {
    let default_namespace = "pokemon:api";
    match namespace {
        Some(namespace) => debugrs::RsDebugger::new(format!("{}:{}", default_namespace, namespace)),
        None => debugrs::RsDebugger::new(default_namespace.to_string()),
    }
}