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
        exclude_files: settings.exlude_files,
    };

    let paths = copy_files_to_folder(
        files.clone(),
        settings.target.as_str(),
        settings.move_project_files,
    );

    for (i, file_path) in paths.iter().enumerate() {
        run_copify(file_path, &copify_settings).ok();
        window
            .emit("mover-progress", ((i + 1) * 100) / files.len())
            .unwrap();
    }

    Ok(())
}
