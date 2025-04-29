//! Main Crate Error

use serde::Serialize;

#[derive(thiserror::Error, Debug, Serialize)]
pub enum Error {
    #[error("Generic error: {0}")]
    Generic(String),

    #[error("FileNotFound error: {0}")]
    FileNotFound(String),

    #[error("Copify error: {0}")]
    CopifyFailed(String),

    #[error("Mover error: {0}")]
    MoverFailed(String),

    #[error("Static error: {0}")]
    Static(&'static str),

    #[error(transparent)]
    IO(#[from] std::io::Error),
}
