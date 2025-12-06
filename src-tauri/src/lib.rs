use tauri_plugin_shell::ShellExt;
use tauri::Manager;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// A simple greeting command to verify Tauri-React communication.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Helper command to convert a media file using FFmpeg.
/// 
/// This function:
/// 1. Takes an input file path and desired output format.
/// 2. Calculates a temporary output path.
/// 3. Spawns an FFmpeg sidecar command to perform the conversion.
/// 4. Returns the path to the converted file upon success.
#[tauri::command]
async fn convert_file(app: tauri::AppHandle, file_path: String, output_format: String) -> Result<String, String> {
    let input_path = Path::new(&file_path);
    let temp_dir = app.path().temp_dir().map_err(|e| e.to_string())?;
    
    let file_stem = input_path.file_stem().ok_or("Invalid file name")?.to_string_lossy();
    let output_filename = format!("{}.{}", file_stem, output_format.to_lowercase());
    let output_path = temp_dir.join(&output_filename);

    let output_path_str = output_path.to_string_lossy().to_string();

    // Execute FFmpeg command
    // Note: We use the 'shell' plugin which requires 'ffmpeg' to be allowed in capabilities.
    
    let mut args = vec!["-i", &file_path, "-y"];

    // Smart processing for specific formats
    let format_lower = output_format.to_lowercase();
    
    if format_lower == "ico" {
        // ICO requires max 256x256 dimensions. We resize if larger, keeping aspect ratio.
        args.push("-vf");
        args.push("scale='min(256,iw)':min'(256,ih)':force_original_aspect_ratio=decrease");
    }

    if format_lower == "svg" {
        // FFmpeg does not support raster->vector SVG well. We use the 'embedding' strategy.
        // 1. Read the image dimensions
        let img = image::open(&file_path).map_err(|e| format!("Failed to open image for SVG conversion: {}", e))?;
        let (w, h) = (img.width(), img.height());

        // 2. Read file bytes and encode to base64
        let file_bytes = std::fs::read(&file_path).map_err(|e| e.to_string())?;
        use base64::{Engine as _, engine::general_purpose};
        let b64 = general_purpose::STANDARD.encode(&file_bytes);
        
        let ext = Path::new(&file_path).extension().unwrap_or_default().to_string_lossy().to_lowercase();
        let mime_type = match ext.as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "webp" => "image/webp",
            "gif" => "image/gif",
            _ => "image/png" // Fallback
        };

        // 3. Create SVG content
        let svg_content = format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" width="{}" height="{}" viewBox="0 0 {} {}">
    <image href="data:{};base64,{}" width="{}" height="{}" />
</svg>"#, 
            w, h, w, h, mime_type, b64, w, h
        );

        std::fs::write(&output_path, svg_content).map_err(|e| e.to_string())?;
        return Ok(output_path_str);
    }

    args.push(&output_path_str);

    let output = app.shell().command("ffmpeg")
        .args(args)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(output_path_str)
    } else {
        Err(format!("FFmpeg failed: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

/// Saves a file from a temporary location to a user-selected destination.
/// 
/// Used to move the converted file from the app's temp folder to the User's Downloads or selected folder.
#[tauri::command]
async fn save_file_locally(source: String, destination: String) -> Result<(), String> {
    std::fs::copy(&source, &destination).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, convert_file, save_file_locally])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
