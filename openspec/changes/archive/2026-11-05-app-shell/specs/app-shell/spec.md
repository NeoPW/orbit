# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Addressable destinations on web`
- TO: `### Requirement: Addressable destinations`

## MODIFIED Requirements

### Requirement: Three top-level destinations
The app SHALL provide exactly three top-level destinations, in this order: Home, Plan, Review, and Settings apart from them. Selecting a destination SHALL show its screen and mark it as selected. Until a destination's feature change fills it, its screen SHALL show its title and an empty state.

#### Scenario: Switch destination
- **WHEN** the user selects Plan
- **THEN** the Plan screen is shown and Plan is marked as selected

#### Scenario: Home content
- **WHEN** the user selects Home
- **THEN** the Home screen is shown and Home is marked as selected

#### Scenario: Settings
- **WHEN** the user selects Settings
- **THEN** the Settings screen is shown, Settings is marked as selected and no other destination is

#### Scenario: Placeholder destinations
- **WHEN** the user selects Review before the review feature exists
- **THEN** the Review screen shows its title and an empty state, without placeholder text such as "Coming soon"

### Requirement: Addressable destinations
Each destination SHALL have its own URL path (`/home`, `/plan`, `/review`, `/settings`), on the desktop and in the browser. Reloading SHALL stay on the current destination, and the browser's back and forward SHALL move between visited destinations. The root path and unknown paths SHALL show Home under the path `/home`.

#### Scenario: Reload keeps destination
- **WHEN** the user is on Plan and reloads the page
- **THEN** the app opens on Plan

#### Scenario: Back
- **WHEN** the user goes from Home to Plan to Settings and then goes back
- **THEN** Plan is shown and selected

#### Scenario: Unknown path
- **WHEN** the app is opened at `/does-not-exist`
- **THEN** the Home destination is shown and the path is `/home`

#### Scenario: Root path
- **WHEN** the app is opened at `/`
- **THEN** the Home destination is shown and the path is `/home`

### Requirement: Dark theme
The app SHALL use its dark theme built from the Orbit palette with Inter and Space Grotesk (see visual-design), whatever the system brightness setting.

#### Scenario: System in dark mode
- **WHEN** the operating system or browser is set to dark mode
- **THEN** the app uses its dark theme

#### Scenario: System in light mode
- **WHEN** the operating system or browser is set to light mode
- **THEN** the app still uses its dark theme

## ADDED Requirements

### Requirement: Runs on the desktop and in the browser
The app SHALL start and be fully usable in the Tauri desktop app on Linux and in a desktop browser from the same codebase.

#### Scenario: Start on the desktop
- **WHEN** the desktop app is launched
- **THEN** the app shell is shown with the Home destination selected

#### Scenario: Start in the browser
- **WHEN** the app is opened in Chrome or Firefox
- **THEN** the app shell is shown with the Home destination selected

### Requirement: Sidebar navigation
The app SHALL show the destinations in a sidebar on the left, with Settings at its foot. At a window width of 960 logical pixels or more the sidebar SHALL show each destination's icon and label; below that only the icons, each with its label as accessible name and tooltip. Resizing SHALL NOT change the selected destination.

#### Scenario: Wide window
- **WHEN** the window is 1280 pixels wide
- **THEN** the sidebar shows Home, Plan and Review with icons and labels, and Settings at its foot

#### Scenario: Narrow window
- **WHEN** the window is 800 pixels wide
- **THEN** the sidebar shows only the icons, and hovering an icon shows its label

#### Scenario: Resize keeps destination
- **WHEN** Plan is selected and the window is resized across 960 pixels
- **THEN** Plan remains selected and its screen remains visible

#### Scenario: Keyboard
- **WHEN** the user moves through the sidebar with Tab and presses Enter on Review
- **THEN** the Review screen is shown

### Requirement: Database cannot be opened
When the local database cannot be opened at start, the app SHALL show a full-window message saying so, with the reason, instead of the navigation and screens.

#### Scenario: Failed start
- **WHEN** opening the database fails with an error
- **THEN** the window shows that the database could not be opened and the error's message, and no destination is shown

## REMOVED Requirements

### Requirement: Runs on Android and web
**Reason**: The rebuilt app runs as a desktop app and in the browser; the phone gets a separate companion later.
**Migration**: Replaced by "Runs on the desktop and in the browser".

### Requirement: Responsive navigation
**Reason**: The bottom bar for phone widths is dropped; the desktop window is at least 800 pixels wide.
**Migration**: Replaced by "Sidebar navigation".

### Requirement: Former objective and key result addresses
**Reason**: The app is rebuilt with its own data; no links from the previous app's objective and key result pages exist to be kept working.
**Migration**: None; old addresses open Home like any unknown path.
