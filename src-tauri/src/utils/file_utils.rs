use flate2::write::{GzDecoder, GzEncoder};
use flate2::Compression;
use pathdiff::diff_paths;
use std::fs;
use std::fs::{rename, File};
use std::io::{self, BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub fn copy_sample(sample: &str, project_root: &Path) -> io::Result<String> {
    let filename = Path::new(sample).file_name().unwrap();
    let destination = project_root.join("Samples").join("Imported");

    fs::create_dir_all(&destination)?;

    let dest_file = destination.join(filename);
    fs::copy(sample, &dest_file)?;

    Ok(dest_file.to_string_lossy().into_owned())
}

pub fn compress(input: &Path, output: &Path) -> io::Result<()> {
    let input_file = File::open(input)?;
    let buffered_reader = BufReader::new(input_file);

    let output_file = File::create(output)?;
    let buffered_writer = BufWriter::new(output_file);

    let mut encoder = GzEncoder::new(buffered_writer, Compression::default());
    io::copy(&mut buffered_reader.take(u64::MAX), &mut encoder)?;
    encoder.finish()?;

    Ok(())
}

pub fn decompress(input: &Path, output: &Path) -> io::Result<()> {
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
                    files.push(entry_path.to_path_buf())
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
    let combined_path = base_folder.join(relative_path);
    combined_path.canonicalize()
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
