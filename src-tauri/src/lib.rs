use std::fmt::format;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use flate2::write::{GzEncoder, GzDecoder};
use flate2::Compression;
use std::fs::File;
use std::io::{self, BufReader, BufWriter, Write, Read};
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Runtime};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn copify(window: tauri::Window, folder: &str) -> Result<(), String>{
    let files = find_als_files(folder);
    for (i, file_path) in files.iter().enumerate() {
        // Define the output file path by replacing the extension
        let mut output_path = file_path.clone();
        output_path.set_extension("xml");

        // Perform the decompression
        println!("Decompressing {:?} to {:?}", file_path, output_path);

        window.emit("copify-progress", ((i + 1) * 100) / files.len()).unwrap();
        thread::sleep(Duration::from_secs(1));
        //decompress(&file_path, output_path.as_path());
    }
    Ok(println!("Finished"))
}

fn compress(input: &str, output: &str) -> io::Result<()> {
    // Open the input file
    let input_file = File::open(input)?;  // File is directly returned without Result<>
    let buffered_reader = BufReader::new(input_file);

    // Create the output file
    let output_file = File::create(output)?;  // File is directly returned without Result<>
    let buffered_writer = BufWriter::new(output_file);

    // Create a GzEncoder for compression
    let mut encoder = GzEncoder::new(buffered_writer, Compression::default());

    // Copy the contents from the input to the encoder
    io::copy(&mut buffered_reader.take(u64::MAX), &mut encoder)?;

    // Finish the compression to ensure all data is written
    encoder.finish()?;  // Here `finish` works because encoder is properly created

    Ok(())
}

fn decompress(input: &Path, output: &Path) -> io::Result<()> {
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

fn find_als_files(folder: &str) -> Vec<PathBuf> {
    let mut als_files = Vec::new();

    let path = Path::new(folder);
    if !path.exists() || !path.is_dir() {
        eprintln!("Provided path is not a valid directory: {}", folder);
        return als_files;
    }

    for entry in WalkDir::new(folder)
        .into_iter()
        .filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(extension) = entry_path.extension() {
                if extension == "als" {
                    als_files.push(entry_path.to_path_buf())
                }
            }
        }
    }

    als_files
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, copify])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
