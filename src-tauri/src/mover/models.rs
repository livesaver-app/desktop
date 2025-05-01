use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Debug, Serialize, Deserialize)]
pub struct MoverSettings {
    // Move project files
    pub move_project_files: bool,
    // Include Serum noises
    pub serum_noises: bool,
    // Move or copy samples
    pub move_samples: bool,
    // Backup xml before modifying
    pub create_backup: bool,
    // Input folder to scan
    pub folder: String,
    // Target folder
    pub target: String,
    // Exclude project files
    pub exclude_files: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MoverProgress {
    pub progress: usize,
    pub file_name: String,
    pub is_error: bool,
    pub is_skipped: bool,
    pub error_msg: String,
}