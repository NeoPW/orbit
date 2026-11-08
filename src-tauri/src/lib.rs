mod db;
#[cfg(target_os = "android")]
mod reminders;
#[cfg(desktop)]
mod notify;

use tauri::Manager;
#[cfg(desktop)]
use tauri::LogicalSize;

#[cfg(desktop)]
const DEFAULT_WIDTH: f64 = 1280.0;
#[cfg(desktop)]
const DEFAULT_HEIGHT: f64 = 800.0;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().setup(|app| {
        let database = db::open(app)?;
        app.manage(database);
        #[cfg(desktop)]
        {
            fit_main_window_to_screen(app)?;
            notify::setup_tray(app)?;
        }
        Ok(())
    });

    // The tray, desktop notifications and hiding on close exist only on the desktop.
    #[cfg(desktop)]
    let builder = builder.on_window_event(notify::on_window_event).invoke_handler(tauri::generate_handler![
        db::db_query,
        db::db_batch,
        notify::show_notification
    ]);
    #[cfg(mobile)]
    let builder = builder.invoke_handler(tauri::generate_handler![db::db_query, db::db_batch]);
    // Reminders, the ongoing focus notification and notification taps on Android.
    #[cfg(target_os = "android")]
    let builder = builder.plugin(reminders::init());

    builder.run(tauri::generate_context!()).expect("error while running Orbit");
}

/// Opens at 1280 x 800, or smaller when the screen is smaller.
#[cfg(desktop)]
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
