fn main() {
    // The `reminders` plugin lives in the app (Rust in src/reminders.rs, Kotlin in the Android module);
    // its commands get ACL permissions here. It is only registered on Android.
    tauri_build::try_build(
        tauri_build::Attributes::new().plugin(
            "reminders",
            tauri_build::InlinedPlugin::new()
                .commands(&[
                    "schedule",
                    "show_ongoing",
                    "clear_ongoing",
                    "take_launch_route",
                    "permission_state",
                    "request_permission",
                ])
                .default_permission(tauri_build::DefaultPermissionRule::AllowAllCommands),
        ),
    )
    .expect("failed to run tauri-build");
}
