//! Main Crate Error

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("Generic error: {0}")]
    Generic(String),

    #[error("Static error: {0}")]
    Static(&'static str),

    #[error(transparent)]
    IO(#[from] std::io::Error),
}
