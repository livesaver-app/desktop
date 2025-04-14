mod copify;
mod error;
mod mover;
mod oauth;
mod prelude;
mod utils;

use copify::{copify, get_als_files};
use mover::mover;
use oauth::start_server;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            copify,
            mover,
            get_als_files,
            start_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
