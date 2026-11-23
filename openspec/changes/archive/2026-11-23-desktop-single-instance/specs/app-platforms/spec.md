# Spec Delta

## ADDED Requirements

### Requirement: Single desktop instance
Only one desktop Orbit SHALL run at a time. Starting the desktop app while it already runs (with its window shown, minimised or hidden in the tray) SHALL show, unminimise and focus the running app's window on the page it was on, and SHALL NOT start a second app or add a second tray icon. The development build ("Orbit Dev") SHALL count as a different app from the release, so each of them can run once next to the other.

#### Scenario: Start again while hidden in the tray
- **WHEN** Orbit's window is closed to the tray on the Goals page and the user starts Orbit from the launcher
- **THEN** the existing window appears focused on the Goals page, and there is still one Orbit process and one Orbit tray icon

#### Scenario: Start again while the window is open
- **WHEN** Orbit's window is minimised and the user starts Orbit again
- **THEN** the existing window is restored and focused, and no second window opens

#### Scenario: Development run next to the release
- **WHEN** the release Orbit is running and a development run ("Orbit Dev") is started
- **THEN** "Orbit Dev" opens its own window and tray icon, and the release Orbit keeps running unchanged

#### Scenario: Second development run
- **WHEN** "Orbit Dev" is running and the development app is started again
- **THEN** the running "Orbit Dev" window is shown and focused, and no second "Orbit Dev" starts
