use serde::{Deserialize, Serialize};
use std::fs;
use std::time::SystemTime;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub tauri_version: String,
    pub is_mobile: bool,
    pub is_desktop: bool,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosticReport {
    pub status: String,
    pub platform: PlatformInfo,
    pub offline_cache_available: bool,
}

#[tauri::command]
fn get_native_platform_info() -> PlatformInfo {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let is_mobile = cfg!(any(target_os = "android", target_os = "ios"));
    let is_desktop = !is_mobile;

    PlatformInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        tauri_version: tauri::VERSION.to_string(),
        is_mobile,
        is_desktop,
        timestamp: now,
    }
}

#[tauri::command]
fn get_offline_cache_dir(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("polaris_cache");

    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_offline_snapshot(app: tauri::AppHandle, key: String, data: String) -> Result<bool, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("polaris_cache");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    let sanitized_key = key.chars().filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-').collect::<String>();
    let file_path = dir.join(format!("{}.json", sanitized_key));
    fs::write(file_path, data).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn load_offline_snapshot(app: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("polaris_cache");
    let sanitized_key = key.chars().filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-').collect::<String>();
    let file_path = dir.join(format!("{}.json", sanitized_key));
    if file_path.exists() {
        let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn run_native_diagnostics(app: tauri::AppHandle) -> DiagnosticReport {
    let platform = get_native_platform_info();
    let cache_ok = app.path().app_data_dir().map(|p| p.exists()).unwrap_or(false);

    DiagnosticReport {
        status: "OPERATIONAL".to_string(),
        platform,
        offline_cache_available: cache_ok,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_native_platform_info,
            get_offline_cache_dir,
            save_offline_snapshot,
            load_offline_snapshot,
            run_native_diagnostics
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
