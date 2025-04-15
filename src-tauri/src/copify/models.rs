use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Debug, Serialize, Deserialize)]
pub struct CopifySettings {
    pub serum_noises: bool,
    pub move_samples: bool,
    pub create_backup: bool,
    pub folder: String,
    pub exclude_files: Vec<String>,
}
