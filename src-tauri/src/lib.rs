mod copify;
mod error;
mod prelude;
mod utils;

use copify::copify;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![copify])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
