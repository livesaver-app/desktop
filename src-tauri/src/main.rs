// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// Mute some warnings
#![allow(unused)]

fn main() {
    livesaver_lib::run()
}
