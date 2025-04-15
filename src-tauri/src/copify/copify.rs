use crate::copify::models::CopifySettings;
use crate::copify::update_sample_refs;
use crate::utils::*;
use std::fs;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use tauri::Emitter;

#[tauri::command]
pub async fn copify(window: tauri::Window, settings: CopifySettings) -> Result<(), String> {
    let files = find_by_extension(settings.folder.as_str(), ALS);

    if files.is_empty() {
        return Err("No Ableton Live project files found".to_string());
    }

    for (i, file_path) in files.iter().enumerate() {
        if !settings
            .exclude_files
            .iter()
            .any(|k| file_path.to_string_lossy().contains(k))
        {
            run_copify(file_path, &settings).ok();
        }
        window
            .emit("copify-progress", ((i + 1) * 100) / files.len())
            .unwrap();
    }
    Ok(())
}

#[tauri::command]
pub async fn get_als_files(window: tauri::Window, folder: String) -> Result<Vec<PathBuf>, String> {
    let files = find_by_extension(folder.as_str(), ALS);

    if files.is_empty() {
        return Err("No Ableton Live project files found".to_string());
    }

    Ok(files)
}

// TODO : Handle errors
pub fn run_copify(file_path: &PathBuf, settings: &CopifySettings) -> Result<(), io::Error> {
    let mut xml = file_path.clone();
    xml.set_extension(XML);

    if settings.create_backup {
        create_backup(file_path)?;
    }

    decompress(file_path, xml.as_path()).ok();
    update_sample_refs(xml.as_path(), settings).ok();
    compress(xml.as_path(), file_path).ok();
    fs::remove_file(xml).ok();
    Ok(())
}

fn create_backup(input: &Path) -> Result<(), io::Error> {
    if input.to_string_lossy().contains(ALS_BACKUP_EXTENSION) {
        println!("Input file is not valid to backup")
    }

    let dir = input
        .parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid file path"))?;
    let filename = input
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid file path"))?;

    let backup_filename = format!(
        "{}{}",
        filename.to_string_lossy().replace(ALS_EXTENSION, ""),
        ALS_BACKUP_EXTENSION
    );

    let backup_file_ref = dir.join(backup_filename);

    fs::copy(input, &backup_file_ref)?;

    Ok(())
}
