use crate::prelude::*;
use flate2::write::{GzDecoder, GzEncoder};
use flate2::Compression;
use pathdiff::diff_paths;
use std::fs;
use std::fs::File;
use std::io::{self, BufReader, BufWriter, ErrorKind, Read};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub fn copy_sample(sample: &str, project_root: &Path) -> Result<String> {
    let filename = Path::new(sample)
        .file_name()
        .ok_or(Error::CopifyFailed("Invalid sample path: no filename".to_string()))?;

    let destination = project_root.join("Samples").join("Imported");

    // Try to create the destination folder
    fs::create_dir_all(&destination)
        .map_err(|e| Error::CopifyFailed(format!("Failed to create destination folder: {}", e)))?;

    let dest_file = destination.join(filename);

    // If the file already exists, optionally overwrite or skip
    match fs::copy(sample, &dest_file) {
        Ok(_) => Ok(dest_file.to_string_lossy().into_owned()),
        Err(e) => {
            match e.kind() {
                ErrorKind::PermissionDenied => Err(Error::CopifyFailed(format!(
                    "Permission denied copying file from {} to {}",
                    sample,
                    dest_file.display()
                ))),
                ErrorKind::AlreadyExists => Err(Error::CopifyFailed(format!(
                    "File already exists: {}",
                    dest_file.display()
                ))),
                _ => Err(Error::CopifyFailed(format!(
                    "Failed to copy {} to {}: {}",
                    sample,
                    dest_file.display(),
                    e
                ))),
            }
        }
    }
}

pub fn compress(input: &Path, output: &Path) -> Result<()> {
    let input_file = File::open(input)?;
    let buffered_reader = BufReader::new(input_file);

    let output_file = File::create(output)?;
    let buffered_writer = BufWriter::new(output_file);

    let mut encoder = GzEncoder::new(buffered_writer, Compression::default());
    io::copy(&mut buffered_reader.take(u64::MAX), &mut encoder)?;
    encoder.finish()?;

    Ok(())
}

pub fn decompress(input: &Path, output: &Path) -> Result<()> {
    // Open the compressed input file
    let input_file = File::open(input)?;
    let buffered_reader = BufReader::new(input_file);

    // Create the output file
    let output_file = File::create(output)?;
    let buffered_writer = BufWriter::new(output_file);

    // Create a GzDecoder for decompression
    let mut decoder = GzDecoder::new(buffered_writer);

    // Copy the decompressed data to the output file
    io::copy(&mut buffered_reader.take(u64::MAX), &mut decoder)?;

    Ok(())
}

/// Find files by a specific file type
///
/// Default ignore Ableton project files that
/// are in the "Backup" folder
pub fn find_by_extension(folder: &str, ext: &str) -> Vec<PathBuf> {
    let mut files = Vec::new();

    let path = Path::new(folder);
    if !path.exists() || !path.is_dir() {
        eprintln!("Provided path is not a valid directory: {}", folder);
        return files;
    }

    for entry in WalkDir::new(folder).into_iter().filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(extension) = entry_path.extension() {
                if extension == ext {
                    let file_path = entry_path.to_path_buf();
                    if !is_backup_folder(&file_path) {
                        files.push(entry_path.to_path_buf())
                    }
                }
            }
        }
    }

    files
}

pub fn get_last_segment(path: &str) -> &str {
    path.split("/").last().unwrap()
}

pub fn absolute_path_from_base(base_folder: &Path, relative_path: &Path) -> io::Result<PathBuf> {
    return base_folder.join(relative_path).canonicalize();
}

pub fn find_relative_path(base_folder: &str, absolute_path: &str) -> String {
    let base_folder = Path::new(base_folder);
    let absolute_path = Path::new(absolute_path);

    // Calculate relative path, handling error cases
    match diff_paths(absolute_path, base_folder) {
        Some(relative_path) => {
            // Normalize path separators to forward slashes
            let relative_path = relative_path
                .to_string_lossy()
                .replace(std::path::MAIN_SEPARATOR, "/");
            relative_path
        }
        None => {
            // Return the absolute path if relative path calculation fails
            absolute_path.to_string_lossy().to_string()
        }
    }
}

pub fn move_or_copy_files(
    files: Vec<PathBuf>,
    target_folder: &str,
    move_files: bool,
) -> Result<Vec<PathBuf>> {
    let mut new_paths = Vec::new();
    let target_base = Path::new(target_folder);

    for file_path in &files {
        let source_folder = match file_path.parent() {
            Some(folder) => folder,
            None => continue,
        };

        let folder_name = match source_folder.file_name() {
            Some(name) => name,
            None => continue,
        };

        let target_subfolder = target_base.join(folder_name);

        if move_files {
            fs::rename(source_folder, &target_subfolder)?; // moves entire folder
        } else {
            copy_dir_all(source_folder, &target_subfolder)?; // custom recursive copy
        }

        let new_file_path = target_subfolder.join(file_path.file_name().unwrap_or_default());

        new_paths.push(new_file_path);
    }

    Ok(new_paths)
}

fn copy_dir_all(src: &Path, dst: &Path) -> io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let entry_path = entry.path();
        let dest_path = dst.join(entry.file_name());

        if entry_path.is_dir() {
            copy_dir_all(&entry_path, &dest_path)?;
        } else {
            fs::copy(&entry_path, &dest_path)?;
        }
    }

    Ok(())
}

pub fn is_backup_folder(path: &PathBuf) -> bool {
    path.parent()
        .and_then(|parent| parent.file_name())
        .map(|name| name == "Backup")
        .unwrap_or(false)
}
