use tauri::Emitter;
use tauri::{command, Window};
use tauri_plugin_oauth::start;

#[command]
pub async fn start_server(window: Window) -> Result<u16, String> {
    start(move |url| {
        let _ = window.emit("redirect_uri", url);
    })
    .map_err(|err| err.to_string())
}
