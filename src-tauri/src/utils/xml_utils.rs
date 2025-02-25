pub fn sanitize_for_xml(value: &str) -> String {
    value.replace("&", "&amp;")
}

pub fn decode_xml_value(value: &str) -> String {
    value.replace("&amp;", "&")
}
