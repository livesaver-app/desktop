use super::models::MoverSettings;
use crate::utils::*;
use tauri::Emitter;

#[tauri::command]
pub async fn mover(window: tauri::Window, settings: MoverSettings) -> Result<(), String> {
    // Find all Als files
    let files = find_by_extension(settings.folder.as_str(), ALS);
    // Move/Copy the als files to the target folder in its own project folder
    // Run Copify on the newly created folder
    window
        .emit("mover-progress", ((i + 1) * 100) / files.len())
        .unwrap();

    Ok(())
}
