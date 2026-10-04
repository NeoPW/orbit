# Spec Delta

## Purpose

Provides the app's frame on Android and in the browser: theming, the three top-level destinations (Home, Plan, Review) and navigation that adapts to the screen width.

## ADDED Requirements

### Requirement: Runs on Android and web
The app SHALL start and be fully usable on an Android phone and in a desktop browser (Chrome) from the same codebase.

#### Scenario: Start on Android
- **WHEN** the app is launched on an Android phone
- **THEN** the app shell is shown with the Home destination selected

#### Scenario: Start in the browser
- **WHEN** the app is opened in Chrome
- **THEN** the app shell is shown with the Home destination selected

### Requirement: Three top-level destinations
The app SHALL provide exactly three top-level destinations, in this order: Plan, Home, Review. Selecting a destination SHALL show its screen and mark it as selected.

#### Scenario: Switch destination
- **WHEN** the user selects Plan
- **THEN** the Plan screen is shown and Plan is marked as selected

#### Scenario: Placeholder destinations
- **WHEN** the user selects Home or Review
- **THEN** a placeholder is shown stating that the screen comes in a later milestone

### Requirement: Responsive navigation
The app SHALL show a bottom navigation bar when the window is narrower than 600 logical pixels, and a navigation rail on the left otherwise. Resizing SHALL switch between them without losing the selected destination.

#### Scenario: Phone width
- **WHEN** the window width is less than 600 logical pixels
- **THEN** destinations are shown in a bottom navigation bar and no navigation rail is shown

#### Scenario: Desktop width
- **WHEN** the window width is 600 logical pixels or more
- **THEN** destinations are shown in a navigation rail and no bottom navigation bar is shown

#### Scenario: Resize keeps destination
- **WHEN** Plan is selected and the window is resized across the 600 pixel boundary
- **THEN** Plan remains selected and its screen remains visible

### Requirement: Addressable destinations on web
Each top-level destination SHALL have its own URL path (`/home`, `/plan`, `/review`) so that a browser reload stays on the current destination.

#### Scenario: Reload keeps destination
- **WHEN** the user is on Plan in the browser and reloads the page
- **THEN** the app opens on Plan

#### Scenario: Unknown path
- **WHEN** the app is opened at a path that does not exist
- **THEN** the app shows the Home destination

### Requirement: Date display format
Every calendar date shown in the app SHALL be displayed as `dd-mm-yyyy` with leading zeros, independent of the device or browser locale. Date ranges SHALL be shown as `dd-mm-yyyy – dd-mm-yyyy`. Date fields SHALL show the selected date in the same format. This affects display only, not how dates are stored.

#### Scenario: Single date
- **WHEN** a project has deadline 2026-12-31
- **THEN** it is shown as `31-12-2026`

#### Scenario: Leading zeros
- **WHEN** a date is 5 March 2026
- **THEN** it is shown as `05-03-2026`

#### Scenario: Date range
- **WHEN** an objective runs from 2026-10-01 to 2026-12-31
- **THEN** its date range is shown as `01-10-2026 – 31-12-2026`

#### Scenario: Locale independent
- **WHEN** the device or browser locale is US English
- **THEN** dates are still shown as `dd-mm-yyyy`

#### Scenario: Selected date in a form
- **WHEN** the user picks 15 November 2026 as a deadline in a form
- **THEN** the date field shows `15-11-2026`

### Requirement: Light and dark theme
The app SHALL use a Material 3 theme with a light and a dark variant and SHALL follow the system brightness setting.

#### Scenario: System in dark mode
- **WHEN** the operating system or browser is set to dark mode
- **THEN** the app uses its dark theme

#### Scenario: System in light mode
- **WHEN** the operating system or browser is set to light mode
- **THEN** the app uses its light theme
