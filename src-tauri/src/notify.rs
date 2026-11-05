//! Desktop notifications and the tray. `notify-rust` reports clicks on Linux,
//! which the Tauri notification plugin does not.

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, WindowEvent};

pub const CLICK_EVENT: &str = "notification-clicked";

/// Shows and focuses the main window.
pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Tray icon with "Open Orbit" / "Quit"; clicking the icon opens the window.
pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Orbit", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    let mut tray = TrayIconBuilder::new()
        .tooltip("Orbit")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

/// Closing the main window hides it; the app keeps running in the tray.
pub fn on_window_event(window: &tauri::Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == "main" {
            api.prevent_close();
            let _ = window.hide();
        }
    }
}

/// Shows a notification. Clicking it opens the window and emits
/// `notification-clicked` with the route. Without action support the
/// notification is still shown.
#[tauri::command]
pub fn show_notification(app: AppHandle, title: String, body: String, route: String) -> Result<(), String> {
    let mut notification = notify_rust::Notification::new();
    notification.summary(&title).body(&body).appname("Orbit");
    #[cfg(target_os = "linux")]
    notification.action("default", "Open");

    let handle = notification.show().map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    std::thread::spawn(move || {
        handle.wait_for_action(|action| {
            if action == "default" {
                show_main_window(&app);
                let _ = app.emit(CLICK_EVENT, route);
            }
        });
    });
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (handle, app, route);
    }
    Ok(())
}
