use std::path::PathBuf;
use super::models::{MoverProgress, MoverSettings};
use crate::copify::*;
use crate::utils::*;
use tauri::Emitter;
use crate::error::Error;

#[tauri::command]
pub async fn mover(window: tauri::Window, settings: MoverSettings) -> Result<(), Error> {
    let files = find_by_extension(settings.folder.as_str(), ALS);

    if files.is_empty() {
        return Err(Error::FileNotFound("No Ableton Live project files found".to_string()));
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
    )?;

    let progress_name = "mover-progress";

    for (i, file_path) in paths.iter().enumerate() {
        let progress_value = ((i + 1) * 100) / paths.len();
        let file_name_str = file_path.to_string_lossy().to_string();

        if should_run(file_path, settings.exclude_files.to_vec()) {
            let progress = match run_copify(file_path, &copify_settings) {
                Ok(_) => on_success(file_name_str.clone(), progress_value),
                Err(e) => on_error(file_name_str.clone(), progress_value, e.to_string())
            };
            window.emit(progress_name, progress).unwrap()
        } else {
            window.emit(progress_name, on_skip(file_name_str.clone(), progress_value)).unwrap()
        };
    }
    Ok(())
}

fn should_run(file_path: &PathBuf, exclude: Vec<String>) -> bool {
    if !exclude
        .iter()
        .any(|k| file_path.to_string_lossy().contains(k)) {
        true
    } else {
        false
    }
}

fn on_success(file_name: String, progress: usize) -> MoverProgress {
    make_progress(file_name, progress, false, false, "".to_string())
}

fn on_error(file_name: String, progress: usize, error_msg: String) -> MoverProgress {
    make_progress(file_name, progress, true, false, error_msg)
}

fn on_skip(file_name: String, progress: usize) -> MoverProgress {
    make_progress(file_name, progress, false, true, "Project was skipped.".to_string())
}

fn make_progress(
    file_name: String,
    progress: usize,
    is_error: bool,
    is_skipped: bool,
    error_msg: String,
) -> MoverProgress {
    MoverProgress {
        is_error,
        is_skipped,
        error_msg,
        progress,
        file_name,
    }
}