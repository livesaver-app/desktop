mod copify;
mod error;
mod mover;
mod prelude;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            crate::copify::copify,
            crate::mover::mover,
            crate::copify::get_als_files]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
