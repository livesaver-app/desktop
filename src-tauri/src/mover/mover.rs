use super::models::MoverSettings;
use crate::copify::*;
use crate::utils::*;
use tauri::Emitter;

#[tauri::command]
pub async fn mover(window: tauri::Window, settings: MoverSettings) -> Result<(), String> {
    let files = find_by_extension(settings.folder.as_str(), ALS);

    if files.is_empty() {
        return Err("No Ableton Live project files found".to_string());
    }

    let copify_settings = CopifySettings {
        serum_noises: settings.serum_noises,
        move_samples: settings.move_samples,
        create_backup: settings.create_backup,
        folder: settings.target.clone(),
        exclude_files: settings.exclude_files.clone(),
    };

    let paths = move_or_copy_files(
        files.clone(),
        settings.target.as_str(),
        settings.move_project_files,
    );

    for (i, file_path) in paths.iter().enumerate() {
        if !settings
            .exclude_files
            .iter()
            .any(|k| file_path.to_string_lossy().contains(k))
        {
            run_copify(file_path, &copify_settings).ok();
        }
        window
            .emit("mover-progress", ((i + 1) * 100) / paths.len())
            .unwrap();
    }
    Ok(())
}
