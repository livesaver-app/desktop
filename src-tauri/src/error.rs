//! Main Crate Error

use std::io;
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

    #[error("Xml error: {0}")]
    Xml(String),
}

impl From<io::Error> for Error {
    fn from(e: io::Error) -> Self {
        Error::Generic(e.to_string())
    }
}

impl From<quick_xml::Error> for Error {
    fn from(err: quick_xml::Error) -> Self {
        Error::Xml(err.to_string())
    }
}