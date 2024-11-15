use std::fmt::{Debug};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use flate2::write::{GzEncoder, GzDecoder};
use flate2::Compression;
use std::fs::{rename, File};
use std::io::{self, BufReader, BufWriter, Write, Read};
use std::{fs, thread};
use std::borrow::Cow;
use std::ops::Deref;
use std::time::Duration;
use pathdiff::diff_paths;
use serde::{Deserialize, Serialize};
use tauri::{Emitter};
use quick_xml::{Reader, Writer};
use quick_xml::events::{BytesStart, Event};
use quick_xml::events::attributes::Attribute;
use quick_xml::name::QName;

#[derive(Debug, Serialize, Deserialize)]
struct CopifySettings {
    exclude_serum_noises: bool,
    move_samples: bool,
    create_backup: bool,
}

impl Default for CopifySettings {
    fn default() -> Self {
        CopifySettings {
            exclude_serum_noises: true,
            move_samples: false,
            create_backup: false,
        }
    }
}

static SAMPLES_IMPORTED: &str = "Samples/Imported/";

#[tauri::command]
async fn copify(window: tauri::Window, folder: &str) -> Result<(), String> {
    let settings = CopifySettings::default();
    let files = find_als_files(folder);
    for (i, file_path) in files.iter().enumerate() {
        // Define the output file path by replacing the extension
        let mut xml = file_path.clone();
        xml.set_extension("xml");

        //thread::sleep(Duration::from_secs(1));
        if (settings.create_backup) {
            create_backup(file_path);
        }
        decompress(file_path, xml.as_path());
        update_sample_refs(xml.as_path(), &settings);
        compress(xml.as_path(), file_path);
        fs::remove_file(xml);
        window.emit("copify-progress", ((i + 1) * 100) / files.len()).unwrap();
    }
    Ok(println!("Finished"))
}

fn update_sample_refs(xml_path: &Path, settings: &CopifySettings) -> io::Result<()> {
    let dir = xml_path.parent().unwrap();
    let temp_path = dir.join("temp_output.xml");

    // Open the input file for reading
    let file = File::open(xml_path)?;
    let mut reader = Reader::from_reader(BufReader::new(file));
    reader.trim_text(true);

    // Prepare a writer for the temporary output file
    let temp_file = File::create(&temp_path)?;
    let mut writer = Writer::new(BufWriter::new(temp_file));

    let mut buf = Vec::new();
    let mut inside_sample_ref = false;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Decl(ref e)) => {
                writer.write_event(Event::Decl(e.clone()));
            }
            Ok(Event::Start(ref e)) => {
                let tag = reader.decoder().decode(e.name().0).unwrap().to_string();
                if tag == "SampleRef" {
                    inside_sample_ref = true;
                }
                writer.write_event(Event::Start(e.clone()));
            }
            Ok(Event::Empty(ref e)) => {
                let tag = reader.decoder().decode(e.name().0).unwrap().to_string();
                if tag == "Path" && inside_sample_ref {
                    // Modify the Path element's Value attribute with the new absolute path
                    let mut path_element = e.clone();
                    if let Some(path_value) = get_value_attribute(&path_element, settings) {
                        let sanitized = decode_xml_value(&path_value);
                        let absolute = copy_sample(&sanitized, dir).unwrap();
                        modify_value_attribute(&mut path_element, "Value", &absolute);
                    }
                    writer.write_event(Event::Empty(path_element));
                } else if tag == "RelativePath" && inside_sample_ref {
                    let mut path_element = e.clone();
                    if let Some(path_value) = get_value_attribute(&path_element, settings) {
                        modify_value_attribute(&mut path_element, "Value", format!("{}{}", SAMPLES_IMPORTED, get_last_segment(&path_value)).as_str());
                    }
                    writer.write_event(Event::Empty(path_element));
                } else {
                    writer.write_event(Event::Empty(e.clone()));
                }
            }
            Ok(Event::End(ref e)) => {
                let tag = reader.decoder().decode(e.name().0).unwrap().to_string();
                if tag == "SampleRef" {
                    inside_sample_ref = false;
                }
                writer.write_event(Event::End(e.clone()));
            }
            Ok(Event::Text(ref e)) => {
                writer.write_event(Event::Text(e.clone()));
            }
            Ok(Event::Eof) => break,
            Err(e) => {
                eprintln!("Error parsing XML: {:?}", e);
                break;
            }
            _ => {}
        }
        buf.clear();
    }

    // Close the writer to ensure all content is flushed to temp file
    writer.into_inner().flush()?;

    // Replace original file with the temporary output file
    rename(&temp_path, xml_path)?;

    Ok(())
}

fn get_last_segment(path: &str) -> &str {
    path.split("/").last().unwrap()
}

// Helper function to modify the Value attribute in Path element
fn modify_value_attribute(element: &mut BytesStart, attr_key: &str, new_value: &str) {
    // Step 1: Collect and clone all attributes to avoid borrowing `element`
    let mut new_attributes: Vec<Attribute> = Vec::new();
    let mut found = false;
    let clone = element.clone();

    for attr in clone.attributes() {
        let attr = attr.unwrap(); // Unwrap the Result to get the attribute
        if attr.key == QName(attr_key.as_bytes()) {
            // Modify the attribute if it matches `attr_key`
            new_attributes.push(Attribute {
                key: attr.key,
                value: Cow::from(new_value.as_bytes().to_vec()),
            });
            found = true;
        } else {
            // Otherwise, clone the existing attribute as-is
            new_attributes.push(attr.clone());
        }
    }

    // If the attribute wasn't found, add it to the new attributes
    if !found {
        new_attributes.push(Attribute {
            key: QName(attr_key.as_bytes()),
            value: Cow::from(new_value.as_bytes().to_vec()),
        });
    }

    // Step 2: Clear the existing attributes in `element`
    element.clear_attributes();

    // Step 3: Push the modified attributes back into `element`
    for attr in new_attributes {
        element.push_attribute(attr);
    }
}

fn get_value_attribute(e: &BytesStart, settings: &CopifySettings) -> Option<String> {
    for attribute in e.attributes() {
        if let Ok(attr) = attribute {
            if attr.key == quick_xml::name::QName(b"Value") {
                let key = Some(String::from_utf8_lossy(&attr.value).into_owned());
                return if (settings.exclude_serum_noises) {
                    if (key?.contains("Serum Presets/Noises")) {
                        None
                    } else { Some(String::from_utf8_lossy(&attr.value).into_owned()) }
                } else {
                    Some(String::from_utf8_lossy(&attr.value).into_owned())
                };
            }
        }
    }
    None
}

fn sanitize_for_xml(value: &str) -> String {
    value.replace("&", "&amp;")
}

fn decode_xml_value(value: &str) -> String {
    value.replace("&amp;", "&")
}

fn absolute_path_from_base(base_folder: &Path, relative_path: &Path) -> io::Result<PathBuf> {
    let combined_path = base_folder.join(relative_path);
    combined_path.canonicalize()
}

fn copy_sample(sample: &str, project_root: &Path) -> io::Result<String> {
    let filename = Path::new(sample).file_name().unwrap();
    let destination = project_root.join("Samples").join("Imported");

    fs::create_dir_all(&destination)?;

    let dest_file = destination.join(filename);
    fs::copy(sample, &dest_file)?;

    Ok(dest_file.to_string_lossy().into_owned())
}

fn find_relative_path(base_folder: &str, absolute_path: &str) -> String {
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

fn create_backup(input: &Path) -> Result<(), io::Error> {
    let app_backup_suffix = ".als.lsbak";

    if (!input.ends_with(".als") || input.to_string_lossy().contains(app_backup_suffix)) {
        println!("Input file is not valid to backup")
    }

    let dir = input.parent().ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid file path"))?;
    let filename = input.file_name().ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Invalid file path"))?;

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

fn compress(input: &Path, output: &Path) -> io::Result<()> {
    let input_file = File::open(input)?;
    let buffered_reader = BufReader::new(input_file);

    let output_file = File::create(output)?;
    let buffered_writer = BufWriter::new(output_file);

    let mut encoder = GzEncoder::new(buffered_writer, Compression::default());
    io::copy(&mut buffered_reader.take(u64::MAX), &mut encoder)?;
    encoder.finish()?;

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
        .invoke_handler(tauri::generate_handler![copify])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
