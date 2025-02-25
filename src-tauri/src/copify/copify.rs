use crate::copify::models::CopifySettings;
use crate::copify::update_sample_refs;
use crate::utils::{compress, decompress, find_by_extension};
use std::fs;
use std::io;
use std::path::Path;
use tauri::Emitter;

#[tauri::command]
pub async fn copify(window: tauri::Window, mut settings: CopifySettings) -> Result<(), String> {
    let files = find_by_extension(settings.folder.as_str(), "als");
    for (i, file_path) in files.iter().enumerate() {
        // Define the output file path by replacing the extension
        let mut xml = file_path.clone();
        xml.set_extension("xml");

        if settings.create_backup {
            let _ = create_backup(file_path);
        }

        let _ = decompress(file_path, xml.as_path());
        let _ = update_sample_refs(xml.as_path(), &settings);
        let _ = compress(xml.as_path(), file_path);
        let _ = fs::remove_file(xml);

        window
            .emit("copify-progress", ((i + 1) * 100) / files.len())
            .unwrap();
    }
    Ok(println!("Finished"))
}

fn create_backup(input: &Path) -> Result<(), io::Error> {
    let app_backup_suffix = ".als.lsbak";

    if (!input.ends_with(".als") || input.to_string_lossy().contains(app_backup_suffix)) {
        println!("Input file is not valid to backup")
    }

    let dir = input
        .parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid file path"))?;
    let filename = input
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid file path"))?;

    // Construct the backup filename with the suffix appended
    let backup_filename = format!(
        "{}{}",
        filename.to_string_lossy().replace(".als", ""),
        app_backup_suffix
    );

    // Build the full path for the backup file
    let backup_file_ref = dir.join(backup_filename);

    // Copy the file to the backup file path
    fs::copy(input, &backup_file_ref)?;

    Ok(())
}
