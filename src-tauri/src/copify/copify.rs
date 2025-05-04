use crate::copify::models::CopifySettings;
use crate::copify::update_sample_refs;
use crate::utils::*;
use crate::error::Error;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use tauri::Emitter;

#[tauri::command]
pub async fn copify(window: tauri::Window, settings: CopifySettings) -> Result<(), Error> {
    let files = find_by_extension(settings.folder.as_str(), ALS);

    if files.is_empty() {
        return Err(Error::FileNotFound("No Ableton Live project files found".to_string()));
    }

    let progress_name = "copify-progress";

    for (i, file_path) in files.iter().enumerate() {
        let progress_value = ((i + 1) * 100) / files.len();
        let file_name_str = file_path.to_string_lossy().to_string();

        if should_run(file_path, settings.exclude_files.to_vec()) {
            let progress = match run_copify(file_path, &settings) {
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

#[tauri::command]
pub async fn get_als_files(window: tauri::Window, folder: String) -> Result<Vec<PathBuf>, Error> {
    let files = find_by_extension(folder.as_str(), ALS);

    if files.is_empty() {
        return Err(Error::FileNotFound("No Ableton Live project files found".to_string()));
    }

    Ok(files)
}

/// Find a project files samples and move its samples into its folder.
///
/// # Arguments
///
/// * `file_path` - Ableton project file
/// * `settings` - Copify process settings
pub fn run_copify(file_path: &PathBuf, settings: &CopifySettings) -> Result<(), Error> {
    // Skip project files that are in the Ableton Backup folder
    if is_backup_folder(file_path) {
        return Ok(());
    }

    let mut xml = file_path.clone();
    xml.set_extension(XML);

    if settings.create_backup {
        create_backup(file_path)?;
    }

    decompress(file_path, xml.as_path())?;
    update_sample_refs(xml.as_path(), settings)?;
    compress(xml.as_path(), file_path)?;
    fs::remove_file(xml)?;

    Ok(())
}

fn create_backup(input: &Path) -> Result<(), Error> {
    if input.to_string_lossy().contains(ALS_BACKUP_EXTENSION) {
        return Err(Error::CopifyFailed("Input file is not valid to backup".to_string()));
    }

    let dir = input
        .parent()
        .ok_or_else(|| Error::FileNotFound("Invalid file path".to_string()))?;
    let filename = input
        .file_name()
        .ok_or_else(|| Error::FileNotFound("Invalid file path".to_string()))?;

    let backup_filename = format!(
        "{}{}",
        filename.to_string_lossy().replace(ALS_EXTENSION, ""),
        ALS_BACKUP_EXTENSION
    );

    let backup_file_ref = dir.join(backup_filename);

    fs::copy(input, &backup_file_ref)?;

    Ok(())
}

