# app-platforms Specification

## Purpose

Defines where Orbit runs: as an installable desktop application, which is the main way to use it, and as a browser build of the same app, and how the app knows which of the two it is running as.

## Requirements

### Requirement: Installable desktop app on Linux
A release build SHALL produce installable Linux packages (a `.deb` package and an AppImage). The installed app SHALL be named "Orbit", SHALL show the Orbit icon in the application launcher and window, and SHALL open a window titled "Orbit".

#### Scenario: Install and start
- **WHEN** the `.deb` package from a release build is installed and Orbit is started from the launcher
- **THEN** a window titled "Orbit" opens showing the app, and the launcher entry shows the name "Orbit" with the Orbit icon

#### Scenario: AppImage
- **WHEN** the AppImage from a release build is made executable and started
- **THEN** the same app opens without installing anything

### Requirement: Desktop window size
The desktop window SHALL be resizable. It SHALL open at 1280 × 800 logical pixels, or smaller when the screen is smaller, and SHALL NOT be resizable below 800 × 600.

#### Scenario: First start
- **WHEN** the desktop app starts on a 1920 × 1080 screen
- **THEN** the window is 1280 × 800

#### Scenario: Minimum size
- **WHEN** the user drags the window edge to make it smaller than 800 × 600
- **THEN** the window stops shrinking at 800 × 600

### Requirement: Desktop app works offline
The desktop app SHALL start and show its interface without a network connection. All code, styles, fonts and images it needs SHALL be bundled with the app; it SHALL NOT load any of them from the network.

#### Scenario: Start without network
- **WHEN** the computer has no network connection and Orbit is started
- **THEN** the app opens and looks the same as with a connection

### Requirement: Development builds beside the release
Development runs of the desktop app SHALL use an application identity different from the release app's, named "Orbit Dev", so that they keep their own app data and run next to an installed release without touching its data.

#### Scenario: Run during development
- **WHEN** a development run is started on a computer where the release app is installed
- **THEN** its window is titled "Orbit Dev", and the release app's data directory is not used or changed

### Requirement: Browser build
The same app SHALL build to static files that run in current versions of Chrome and Firefox, with the page title "Orbit" and the Orbit icon as the favicon.

#### Scenario: Open in the browser
- **WHEN** the browser build is served and opened in Chrome or Firefox
- **THEN** the app starts, and the tab shows the Orbit icon and the title "Orbit"

### Requirement: Platform detection
The app SHALL determine at startup whether it runs as the desktop app or in a browser. Features that exist only on the desktop SHALL be offered only when it runs as the desktop app, and the browser build SHALL start without errors even though desktop-only interfaces are missing.

#### Scenario: Running as the desktop app
- **WHEN** the app runs inside the desktop app
- **THEN** it reports the platform as desktop

#### Scenario: Running in a browser
- **WHEN** the app runs in a browser tab
- **THEN** it reports the platform as browser, and no error about missing desktop interfaces appears in the console

### Requirement: Keeps running in the tray
Closing the desktop window SHALL hide it and keep Orbit running with an icon in the system tray, so reminders and the focus timer keep working. Clicking the tray icon or its "Open Orbit" entry SHALL show the window again; its "Quit" entry SHALL end the app. The browser build has no tray.

#### Scenario: Close the window
- **WHEN** the user closes the desktop window
- **THEN** the window disappears and the Orbit icon stays in the tray

#### Scenario: Open again
- **WHEN** the window is hidden and the user clicks the tray icon
- **THEN** the window is shown on the screen it was on, with the same page

#### Scenario: Quit
- **WHEN** the user chooses "Quit" in the tray menu
- **THEN** Orbit ends and the tray icon disappears
