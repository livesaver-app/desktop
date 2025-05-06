use crate::utils::Progress;

pub fn on_success(file_name: String, progress: usize) -> Progress {
    make_progress(file_name, progress, false, false, "".to_string())
}

pub fn on_error(file_name: String, progress: usize, error_msg: String) -> Progress {
    make_progress(file_name, progress, true, false, error_msg)
}

pub fn on_skip(file_name: String, progress: usize) -> Progress {
    make_progress(file_name, progress, false, true, "Project was skipped.".to_string())
}

pub fn make_progress(
    file_name: String,
    progress: usize,
    is_error: bool,
    is_skipped: bool,
    error_msg: String,
) -> Progress {
    Progress {
        is_error,
        is_skipped,
        error_msg,
        progress,
        file_name,
    }
}
