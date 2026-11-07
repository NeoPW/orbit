# Spec Delta

## ADDED Requirements

### Requirement: Installable Android app
A build for Android SHALL produce an installable app (an APK) named "Orbit" that shows the Orbit icon in the launcher, opens full screen and starts with the same app as the desktop and browser builds.

#### Scenario: Install and start
- **WHEN** the debug APK is installed on an Android phone and Orbit is started from the launcher
- **THEN** the app opens full screen showing the Home screen, and the launcher entry shows the name "Orbit" with the Orbit icon

### Requirement: Android app works offline
The Android app SHALL start and show its interface without a network connection, keep its data in the app's own storage, and bundle all code, styles, fonts and images it needs.

#### Scenario: Start without network
- **WHEN** the phone is in airplane mode and Orbit is started
- **THEN** the app opens, shows the tasks stored on the phone, and a task can still be completed

### Requirement: Android platform
The app SHALL report its platform as `android` when it runs in the Android app. Features that exist only on the desktop (tray, desktop notifications, window sizing) SHALL NOT be offered or started on Android, and the Android app SHALL start without errors without them.

#### Scenario: Running as the Android app
- **WHEN** the app runs inside the Android app
- **THEN** it reports the platform as android and shows no tray or desktop notification code paths

#### Scenario: Desktop and browser unchanged
- **WHEN** the app runs as the desktop app or in a browser
- **THEN** it reports desktop or browser as before
