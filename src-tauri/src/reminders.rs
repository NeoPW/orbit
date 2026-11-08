//! The `reminders` plugin on Android: forwards each command to the Kotlin `RemindersPlugin`
//! (src-tauri/gen/android/.../reminders), which schedules reminders with the alarm service,
//! checks them with the sync server when due, and shows the ongoing focus notification.

use serde_json::Value;
use tauri::{
    plugin::{Builder, PluginHandle, TauriPlugin},
    Manager, State, Wry,
};

// The commands are declared for the ACL in `build.rs`; keep both lists in step.

struct Reminders(PluginHandle<Wry>);

async fn forward(state: &State<'_, Reminders>, method: &str, payload: Value) -> Result<Value, String> {
    state.0.run_mobile_plugin_async::<Value>(method, payload).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn schedule(state: State<'_, Reminders>, payload: Value) -> Result<Value, String> {
    forward(&state, "schedule", payload).await
}

#[tauri::command]
async fn show_ongoing(state: State<'_, Reminders>, payload: Value) -> Result<Value, String> {
    forward(&state, "showOngoing", payload).await
}

#[tauri::command]
async fn clear_ongoing(state: State<'_, Reminders>) -> Result<Value, String> {
    forward(&state, "clearOngoing", Value::Null).await
}

#[tauri::command]
async fn take_launch_route(state: State<'_, Reminders>) -> Result<Value, String> {
    forward(&state, "takeLaunchRoute", Value::Null).await
}

#[tauri::command]
async fn permission_state(state: State<'_, Reminders>) -> Result<Value, String> {
    forward(&state, "permissionState", Value::Null).await
}

#[tauri::command]
async fn request_permission(state: State<'_, Reminders>) -> Result<Value, String> {
    forward(&state, "requestPermission", Value::Null).await
}

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("reminders")
        .invoke_handler(tauri::generate_handler![
            schedule,
            show_ongoing,
            clear_ongoing,
            take_launch_route,
            permission_state,
            request_permission
        ])
        .setup(|app, api| {
            let handle = api.register_android_plugin("dev.neopw.orbit.reminders", "RemindersPlugin")?;
            app.manage(Reminders(handle));
            Ok(())
        })
        .build()
}
