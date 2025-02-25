use crate::copify::{CopifySettings, SAMPLES_IMPORTED};
use crate::utils::{copy_sample, decode_xml_value, get_last_segment};
use quick_xml::events::attributes::Attribute;
use quick_xml::events::{BytesStart, Event};
use quick_xml::name::QName;
use quick_xml::{Reader, Writer};
use std::borrow::Cow;
use std::fs::rename;
use std::fs::File;
use std::io;
use std::io::BufReader;
use std::io::BufWriter;
use std::io::Write;
use std::path::Path;

pub fn update_sample_refs(xml_path: &Path, settings: &CopifySettings) -> Result<(), io::Error> {
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
                        modify_value_attribute(
                            &mut path_element,
                            "Value",
                            format!("{}{}", SAMPLES_IMPORTED, get_last_segment(&path_value))
                                .as_str(),
                        );
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
                return if settings.serum_noises {
                    if key?.contains("Serum Presets/Noises") {
                        None
                    } else {
                        Some(String::from_utf8_lossy(&attr.value).into_owned())
                    }
                } else {
                    Some(String::from_utf8_lossy(&attr.value).into_owned())
                };
            }
        }
    }
    None
}
