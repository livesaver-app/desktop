use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Progress {
    pub progress: usize,
    pub file_name: String,
    pub is_error: bool,
    pub is_skipped: bool,
    pub error_msg: String,
}
