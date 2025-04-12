use crate::copify::models::CopifySettings;
use crate::copify::update_sample_refs;
use crate::utils::*;
use std::fs;
use std::io;
use std::path::Path;
use tauri::Emitter;

#[tauri::command]
pub async fn copify(window: tauri::Window, settings: CopifySettings) -> Result<(), String> {
    let files = find_by_extension(settings.folder.as_str(), ALS);

    if files.is_empty() {
        return Err("No Ableton Live project files found".to_string());
    }

    for (i, file_path) in files.iter().enumerate() {
        // Define the output file path by replacing the extension
        let mut xml = file_path.clone();
        xml.set_extension(XML);

        if settings.create_backup {
            create_backup(file_path).map_err(|e| e.to_string())?;
        }

        decompress(file_path, xml.as_path()).map_err(|e| e.to_string())?;
        update_sample_refs(xml.as_path(), &settings).map_err(|e| e.to_string())?;
        compress(xml.as_path(), file_path).map_err(|e| e.to_string())?;
        fs::remove_file(xml).map_err(|e| e.to_string())?;

        window
            .emit("copify-progress", ((i + 1) * 100) / files.len())
            .unwrap();
    }
    Ok(())
}

fn create_backup(input: &Path) -> Result<(), io::Error> {
    if !input.ends_with(ALS_EXTENSION) || input.to_string_lossy().contains(ALS_BACKUP_EXTENSION) {
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
