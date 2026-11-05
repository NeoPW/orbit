use tauri::{LogicalSize, Manager};

const DEFAULT_WIDTH: f64 = 1280.0;
const DEFAULT_HEIGHT: f64 = 800.0;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            fit_main_window_to_screen(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Orbit");
}

/// Opens at 1280 x 800, or smaller when the screen is smaller.
fn fit_main_window_to_screen(app: &tauri::App) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window("main") else {
        return Ok(());
    };
    let Some(monitor) = window.current_monitor()? else {
        return Ok(());
    };
    let screen = monitor.size().to_logical::<f64>(monitor.scale_factor());
    if screen.width < DEFAULT_WIDTH || screen.height < DEFAULT_HEIGHT {
        window.set_size(LogicalSize::new(
            DEFAULT_WIDTH.min(screen.width),
            DEFAULT_HEIGHT.min(screen.height),
        ))?;
        window.center()?;
    }
    Ok(())
}
